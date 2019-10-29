const openTagRegexp = /^\s*<\s*([a-zA-Z1-9-]+)/;
const closeTagRegexp = /^\s*<\s*\/\s*([a-zA-Z1-9-]+)>/;
const tagEndRegexp = /^\s*(\/)?>/;
const voidTagNameRegexp = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
const attrNameRegexp = /\s*([.?@a-zA-Z1-9-]+)=/;
const quotedAttrValueRegexp = /\s*(["'])((?:.)*?)\1/;
const rawAttrValueRegexp = /\s*(.+)?[\s>]/;
const doctypeRegexp = /^\s*<!DOCTYPE [^>]+>/i;
const commentRegexp = /^\s*<!--/;
const attrPrefixRegexp = /^(@|\.|\?)/;

const TYPE_NODE = 0;
const TYPE_ATTR = 1;
const TYPE_BOOL_ATTR = 2;
const TYPE_PROPS = 3;
const TYPE_EVENT = 4;

const prefixAttributesTypes = {
  "?": TYPE_BOOL_ATTR,
  ".": TYPE_PROPS,
  "@": TYPE_EVENT
};

const Field = Symbol();

const Template = Symbol();

const Cache = new WeakMap();

export function html(strings) {
  let vdom = Cache.get(strings);
  vdom || Cache.set(strings, (vdom = parse(strings)));
  let key = vdom[0].props && vdom[0].props.key;
  if (key != null && key[Field]) key = arguments[key[Field]];

  return { [Template]: [vdom, arguments, key] };
}

export function render(template, container) {
  const [vdom, args] = template[Template] || [{ [Field]: 1 }, [0, template]];
  let mutations = Cache.get(container);
  if (!mutations) {
    mount(vdom, container, (mutations = []));
    Cache.set(container, mutations);
  }
  resolve(mutations, args);
}

export function renderToString(template) {
  const [vdom, args] = template[Template] || [{ [Field]: 1 }, [0, template]];
  return stringify(vdom, args);
}

function parse(htmls) {
  const root = { children: [] };
  const stack = [];

  let inTag = false;
  let current = root;
  let attrName = "";

  const commit = value => {
    if (inTag && attrName) {
      (current.props || (current.props = {}))[attrName] = value;
      attrName = "";
    } else if (!inTag) {
      current.children.push(value);
    }
  };

  for (let i = 0; i < htmls.length; i++) {
    if (i) commit({ [Field]: i });
    let html = htmls[i];
    let last;
    let r;
    while (html) {
      if (last === html) throw new Error("parse error:\n\t" + last);
      last = html;
      if (inTag) {
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
        } else if ((r = html.match(attrNameRegexp))) {
          html = html.slice(r[0].length);
          attrName = r[1];
        }
      } else {
        if ((r = html.match(doctypeRegexp))) {
          html = html.slice(r[0].length);
        } else if ((r = html.match(commentRegexp))) {
          html = html.slice(html.indexOf("->") + 2);
        } else if ((r = html.match(closeTagRegexp))) {
          html = html.slice(r[0].length);
          while (current.tag !== r[1]) {
            current = stack.pop();
          }
          current = stack.pop();
        } else if ((r = html.match(openTagRegexp))) {
          html = html.slice(r[0].length);

          stack.push(current);
          current.children.push((current = { tag: r[1], children: [] }));
          inTag = true;
        } else {
          const pos = html.indexOf("<");
          const text = html.slice(0, ~pos ? pos : html.length);
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
    if (vdom[Field]) {
      mutations[vdom[Field]] = {
        type: TYPE_NODE,
        node: parent.appendChild(document.createComment(""))
      };
    } else {
      if (vdom == null) vdom = "";
      parent.appendChild(document.createTextNode(vdom));
    }
  } else {
    const { tag, props, children } = vdom;
    const node = parent.appendChild(document.createElement(tag));
    props &&
      Object.keys(props).forEach(name => {
        if (name === "key") return;
        if (props[name][Field]) {
          const r = name.match(attrPrefixRegexp);
          mutations[props[name][Field]] = {
            type: r ? prefixAttributesTypes[r[1]] : TYPE_ATTR,
            node,
            name: r ? name.slice(1) : name
          };
        } else {
          node.setAttribute(name, props[name]);
        }
      });
    mount(children, node, mutations);
  }
}

function resolve(mutations, args) {
  for (let i = 1; i < mutations.length; i++) {
    if (!mutations[i]) continue;
    const { type, node, name, prev } = mutations[i];
    if (args[i] !== prev) {
      if (type === TYPE_NODE) {
        resolveNode(mutations[i], args[i], prev, 0);
      } else if (type === TYPE_ATTR) {
        if (name === "ref") {
          typeof args[i] === "function"
            ? args[i](node)
            : (args[i].current = node);
        } else {
          node.setAttribute(name, args[i]);
        }
      } else if (type === TYPE_BOOL_ATTR) {
        args[i] ? node.setAttribute(name, "") : node.removeAttribute(name);
      } else if (type === TYPE_PROPS) {
        node[name] = args[i];
      } else if (type === TYPE_EVENT) {
        prev && node.removeEventListener(name, prev);
        node.addEventListener(name, args[i]);
      }
      mutations[i].prev = args[i];
    }
  }
}

function resolveNode(mutation, next, prev, index) {
  const base = next != null ? next : prev;
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
    const prevKey = prevKeys[prevIndex];
    const nextKey = nextKeys[nextIndex];
    const next = nexts[nextIndex];

    if (nextKey != null && !prevKeys.includes(nextKey)) {
      nextMutations[nextIndex++] = insertTemplate(
        next,
        mutations[prevIndex]
          ? mutations[prevIndex]._marks[0]
          : parentMutation.node
      );
    } else if (prevKey != null && !nextKeys.includes(prevKey)) {
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
    m._mutations[index] = insertTemplate(
      next,
      m._mutations[index + 1] ? m._mutations[index + 1]._marks[0] : m.node
    );
  } else if (!next) {
    removeTemplate(m._mutations[index]);
    delete m._mutations[index];
  } else {
    resolve(m._mutations[index], next[Template][1]);
  }
}

function resolveText(m, next, prev, index) {
  if (!prev) {
    if (next == null) next = "";
    insertNode(
      ((m._texts || (m._texts = []))[index] = document.createTextNode(next)),
      m.node
    );
  } else if (!next) {
    m._texts[index].parentNode.removeChild(m._texts[index]);
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
  } else if (vdom[Field]) {
    return stringify(args[vdom[Field]]);
  } else if (vdom[Template]) {
    return renderToString(vdom);
  } else if (!vdom.tag) {
    return vdom != null ? "" + vdom : "";
  } else {
    const { tag, props, children } = vdom;
    let s = `<${tag}`;
    if (props) {
      let r;
      let attrs = [];
      for (const name of Object.keys(props)) {
        if (name === "key" || name === "ref") continue;
        let v = props[name];
        if (v[Field]) v = args[v[Field]];
        if ((r = name.match(attrPrefixRegexp))) {
          if (r[0] === "?" && v) attrs.push(name.slice(1));
        } else {
          attrs.push(`${name}="${v}"`);
        }
      }
      if (attrs.length) {
        s += ` ${attrs.join(" ")}`;
      }
    }

    if (children.length) {
      s += ">" + stringify(children, args) + `</${tag}>`;
    } else if (voidTagNameRegexp.test(tag)) {
      s += ">";
    } else {
      s += "/>";
    }
    return s;
  }
}
