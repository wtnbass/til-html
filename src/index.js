const openTagRegexp = /^\s*<\s*([a-zA-Z1-9-]+)/;
const closeTagRegexp = /^\s*<\s*\/\s*([a-zA-Z1-9-]+)>/;
const tagEndRegexp = /^\s*(\/)?>/;
const voidTagNameRegexp = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
const attrNameRegexp = /\s*([.?@a-zA-Z1-9-]+)\s*=/;
const quotedAttrValueRegexp = /\s*(["'])((?:.)*?)\1/;
const rawAttrValueRegexp = /\s*(.+?)[\s>]/;
const doctypeRegexp = /^\s*<!DOCTYPE [^>]+>/i;
const commentStartRegexp = /^\s*<!--/;
const commentEndRegexp = /-->/;
const attrPrefixRegexp = /^(@|\.|\?)([a-zA-Z1-9-]+)/;
const spreadAttrRegexp = /\s*(\.{3})\s*$/;

const Template = Symbol();

const Cache = new WeakMap();

export function html(strings) {
  let vdom = Cache.get(strings);
  vdom || Cache.set(strings, (vdom = parse(strings)));
  let key = vdom[0] && vdom[0].props && vdom[0].props.key;
  if (typeof key === "number") key = arguments[key];

  return { [Template]: [vdom, arguments, key] };
}

export function render(template, container) {
  const [vdom, args] = fromTemplate(template);
  let mutations = Cache.get(container);
  if (!mutations) {
    mount(vdom, container, (mutations = []));
    Cache.set(container, mutations);
  }
  resolve(mutations, args);
}

export function renderToString(template) {
  return stringify(...fromTemplate(template));
}

function fromTemplate(template) {
  return (template && template[Template]) || [1, [0, template]];
}

function parse(htmls) {
  const root = { children: [] };
  const stack = [];
  let inTag = false;
  let inComment = false;
  let current = root;
  let attrName = "";

  function commit(value) {
    if (inComment) return;
    /* istanbul ignore else */
    if (inTag && attrName) {
      (current.props || (current.props = {}))[attrName] = value;
      attrName = "";
    } else if (!inTag) {
      value && current.children.push(value);
    }
  }

  for (let i = 0; i < htmls.length; i++) {
    if (i) commit(i);
    let html = htmls[i];
    let last;
    let r;
    while (html) {
      /* istanbul ignore next */
      if (last === html) throw new Error("parse error:\n\t" + last);
      last = html;
      if (inComment) {
        if ((r = ~html.search(commentEndRegexp))) inComment = false;
        html = html.slice(r ? ~r + 3 : html.length);
      } else if (inTag) {
        /* istanbul ignore else */
        if ((r = html.match(tagEndRegexp))) {
          html = html.slice(r[0].length);
          if (r[1] || voidTagNameRegexp.test(current.tag)) {
            current = stack.pop();
          }
          inTag = false;
        } else if (attrName && (r = html.match(quotedAttrValueRegexp))) {
          html = html.slice(r[0].length);
          commit(r[2]);
        } else if (attrName && (r = html.match(rawAttrValueRegexp))) {
          let p = r[0].indexOf(">");
          html = html.slice(~p ? p : r[0].length);
          commit(r[1]);
        } else if (
          ((r = html.match(spreadAttrRegexp)) && i < htmls.length - 1) ||
          (r = html.match(attrNameRegexp))
        ) {
          html = html.slice(r[0].length);
          attrName = r[1];
        }
      } else {
        if ((r = html.match(doctypeRegexp))) {
          html = html.slice(r[0].length);
        } else if ((r = html.match(commentStartRegexp))) {
          html = html.slice(2);
          inComment = true;
        } else if ((r = html.match(closeTagRegexp))) {
          html = html.slice(r[0].length);
          if (current.tag !== r[1]) {
            let j = stack.length;
            while (j > 0 && stack[j - 1].tag !== r[1]) j--;
            if (j) {
              stack.length = j - 1;
              current = stack.pop();
            }
          } else {
            current = stack.pop();
          }
        } else if ((r = html.match(openTagRegexp))) {
          html = html.slice(r[0].length);

          stack.push(current);
          current.children.push((current = { tag: r[1], children: [] }));
          inTag = true;
        } else {
          (r = html.indexOf("<")) || (r = html.indexOf("<", 1));
          const text = html.slice(0, ~r ? r : html.length);
          html = html.slice(text.length);
          commit(text.replace(/^\s*\n\s*|\s*\n\s*$/g, ""));
        }
      }
    }
  }
  return root.children;
}

function mount(vdom, parent, mutations) {
  if (Array.isArray(vdom)) {
    vdom.forEach(v => mount(v, parent, mutations));
  } else if (!vdom.tag) {
    if (typeof vdom === "number") {
      mutations[vdom] = {
        node: parent.appendChild(document.createComment(""))
      };
    } else {
      parent.appendChild(document.createTextNode(vdom));
    }
  } else {
    const { tag, props, children } = vdom;
    const node = parent.appendChild(document.createElement(tag));
    props &&
      Object.keys(props).forEach(name => {
        if (name === "key") return;
        if (typeof props[name] === "number") {
          mutations[props[name]] = { node, name };
        } else {
          node.setAttribute(name, props[name]);
        }
      });
    mount(children, node, mutations);
  }
}

function resolve(mutations, args) {
  for (let i = 1; i < mutations.length; i++) {
    const m = mutations[i];
    if (m && m.prev !== args[i]) {
      m.name
        ? resolveAttribute(m.node, m.name, args[i], m.prev)
        : resolveNode(m, args[i], m.prev, 0);
      m.prev = args[i];
    }
  }
}

function resolveAttribute(node, name, next, prev, r) {
  if ((r = name.match(attrPrefixRegexp))) {
    /* istanbul ignore else */
    if (r[1] === "?") {
      next ? node.setAttribute(r[2], "") : node.removeAttribute(name);
    } else if (r[1] === ".") {
      node[r[2]] = next;
    } else if (r[1] === "@") {
      prev && node.removeEventListener(r[2], prev);
      node.addEventListener(r[2], next);
    }
  } else if (name === "...") {
    Object.keys(next).forEach(key =>
      resolveAttribute(node, key, next[key], prev && prev[key])
    );
  } else if (name === "ref") {
    typeof next === "function" ? next(node) : (next.current = node);
  } else {
    next != null && node.setAttribute(name, next);
  }
}

function resolveNode(mutation, next, prev, index) {
  const base = next != null ? next : prev;
  if (base == null) return;
  if (Array.isArray(base)) {
    prev = prev || [];
    if (mutation._mutations && base[0][Template][2] != null) {
      resolveTemplatesWithKey(mutation, next, prev);
    } else {
      for (let i = 0; i < prev.length || i < next.length; i++) {
        resolveNode(mutation, next[i], prev[i], i);
      }
    }
  } else if (base[Template]) {
    resolveTemplate(mutation, next, prev, index);
  } else {
    resolveText(mutation, next, prev, index);
  }
}

function resolveTemplatesWithKey(parentMutation, nexts, prevs) {
  const mutations = parentMutation._mutations;
  const nextMutations = [];
  const nextKeys = nexts.map(t => t[Template][2]);
  const prevKeys = prevs.map(t => t[Template][2]);
  let prevIndex = 0;
  let nextIndex = 0;
  while (prevIndex < prevKeys.length || nextIndex < nextKeys.length) {
    const next = nexts[nextIndex];

    if (
      nextKeys[nextIndex] != null &&
      !prevKeys.includes(nextKeys[nextIndex])
    ) {
      nextMutations[nextIndex++] = insertTemplate(
        next,
        mutations[prevIndex]
          ? mutations[prevIndex]._marks[0]
          : parentMutation.node
      );
    } else if (
      prevKeys[prevIndex] != null &&
      !nextKeys.includes(prevKeys[prevIndex])
    ) {
      removeTemplate(mutations[prevIndex++]);
    } else {
      resolve(
        (nextMutations[nextIndex++] = mutations[prevIndex++]),
        next[Template][1]
      );
    }
  }
  parentMutation._mutations = nextMutations;
}

function resolveTemplate(m, next, prev, index) {
  if (!prev) {
    m._mutations = m._mutations || [];
    m._mutations[index] = insertTemplate(next, m.node);
  } else if (!next) {
    removeTemplate(m._mutations[index]);
    delete m._mutations[index];
  } else {
    resolve(m._mutations[index], next[Template][1]);
  }
}

function resolveText(m, next, prev, index) {
  if (prev == null) {
    insertNode(
      ((m._texts || (m._texts = []))[index] = document.createTextNode(next)),
      m.node
    );
  } else if (next == null) {
    m._texts[index].parentNode.removeChild(m._texts[index]);
    delete m._texts[index];
  } else if (next !== prev) {
    m._texts[index].data = next;
  }
}

function insertTemplate(template, refNode) {
  const [vdom, args] = template[Template];
  const fragment = document.createDocumentFragment();
  const mutations = [];
  mutations._marks = [document.createComment(""), document.createComment("")];
  mount(vdom, fragment, mutations);
  resolve(mutations, args);
  insertNode(mutations._marks[0], refNode);
  insertNode(fragment, refNode);
  insertNode(mutations._marks[1], refNode);
  return mutations;
}

function removeTemplate(mutations) {
  let [start, end] = mutations._marks;
  while (start !== end) {
    const next = start.nextSibling;
    end.parentNode.removeChild(start);
    start = next;
  }
  end.parentNode.removeChild(end);
}

function insertNode(newNode, refNode) {
  refNode.parentNode.insertBefore(newNode, refNode);
}

function stringify(vdom, args) {
  if (Array.isArray(vdom)) {
    return vdom.reduce((acc, v) => acc + stringify(v, args), "");
  } else if (vdom == null) {
    return "";
  } else if (typeof vdom === "number" && args) {
    return stringify(args[vdom]);
  } else if (vdom[Template]) {
    return renderToString(vdom);
  } else if (!vdom.tag) {
    return "" + vdom;
  } else {
    const { tag, props, children } = vdom;
    let s = "";
    if (props) {
      let attrs = [];
      const _attrs = (_props, _args) => {
        for (const name of Object.keys(_props)) {
          if (name === "key" || name === "ref") continue;
          let v = _props[name];
          if (typeof v === "number" && _args) v = _args[v];
          if (name === "...") {
            _attrs(v);
          } else if ((s = name.match(attrPrefixRegexp))) {
            if (s[1] === "?" && v) attrs.push(s[2]);
          } else if (v != null) {
            attrs.push(`${name}="${v}"`);
          }
        }
      };
      _attrs(props, args);
      (s = "") || (s = attrs.join(" "));
    }
    s = `<${tag}${s && " " + s}>`;
    if (!voidTagNameRegexp.test(tag)) {
      s += `${stringify(children, args)}</${tag}>`;
    }
    return s;
  }
}
