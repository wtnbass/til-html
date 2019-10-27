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

const Field = Symbol("Field");

const Template = Symbol("Template");

const Cache = new WeakMap();

export function html(strings, ...values) {
  let vdom = Cache.get(strings);
  if (!vdom) {
    Cache.set(strings, (vdom = parse(strings)));
  }

  let key;
  if (vdom[0].props && vdom[0].props.key) {
    key = vdom[0].props.key;
    if (key[Field]) key = values[key[Field]];
  }

  return { [Template]: [vdom, values, key] };
}

export function render(template, container) {
  const [vdom, values] = template[Template];
  let mutations = Cache.get(container);
  if (!mutations) {
    mount(vdom, container, (mutations = []));
    Cache.set(container, mutations);
  }
  setValues(mutations, values);
}

export function renderToString(template) {
  const [vdom, values] = template[Template];
  return stringify(vdom, values);
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
    if (i) commit({ [Field]: i - 1 });
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

          const next = { tag: r[1], children: [] };
          current.children.push(next);
          stack.push(current);
          current = next;
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
    if (vdom[Field] != null) {
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
        if (props[name][Field] != null) {
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

function setValues(mutations, values) {
  for (let i = 0; i < mutations.length; i++) {
    if (!mutations[i]) continue;
    const { type, node, name, prev } = mutations[i];
    if (values[i] !== prev) {
      if (type === TYPE_NODE) {
        resolveNode(mutations[i], values[i], prev);
      } else if (type === TYPE_ATTR) {
        if (name === "ref") {
          if (typeof values[i] === "function") {
            values[i](node);
          } else {
            values[i].current = node;
          }
        } else {
          node.setAttribute(name, values[i]);
        }
      } else if (type === TYPE_BOOL_ATTR) {
        if (values[i]) {
          node.setAttribute(name, "");
        } else {
          node.removeAttribute(name);
        }
      } else if (type === TYPE_PROPS) {
        node[name] = values[i];
      } else if (type === TYPE_EVENT) {
        prev && node.removeEventListener(name, prev);
        node.addEventListener(name, values[i]);
      }
      mutations[i].prev = values[i];
    }
  }
}

function resolveNode(mutation, next, prev, index = 0) {
  if (Array.isArray(next || prev)) {
    resolveChildren(mutation, next || [], prev || []);
  } else if ((next || prev)[Template] != null) {
    resolveTemplate(mutation, next, prev, index);
  } else {
    resolveText(mutation, next, prev, index);
  }
}

function resolveChildren(mutation, nexts, prevs) {
  for (let i = 0; i < nexts.length || i < prevs.length; i++) {
    if ((nexts[i] || prevs[i])[Template]) {
      let next = nexts[i];
      let prev = prevs[i];
      let key;
      if (next && (key = next[Template][2])) {
        for (let j = 0; j < prevs.length; j++) {
          if (prevs[j] && key === prevs[j][Template][2]) {
            prev = prevs[j];
            break;
          }
          prev = undefined;
        }
      }

      resolveTemplate(mutation, next, prev, i);
    } else {
      resolveText(mutation, nexts[i], prevs[i], i);
    }
  }
}

function resolveTemplate(m, next, prev, index = 0) {
  if (!prev) {
    const [vdom, values] = next[Template];
    const fragment = document.createDocumentFragment();
    const start = document.createComment("");
    const end = document.createComment("");
    (m._marks || (m._marks = []))[index] = [start, end];
    mount(vdom, fragment, ((m._mutations || (m._mutations = []))[index] = []));
    setValues(m._mutations[index], values);
    insertNode(start, m.node);
    insertNode(fragment, m.node);
    insertNode(end, m.node);
  } else if (!next) {
    let [start, end] = m._marks[index];
    while (start !== end) {
      const next = start.nextSibling;
      end.parentNode.removeChild(start);
      start = next;
    }
    end.parentNode.removeChild(end);
  } else {
    setValues(m._mutations[index], next[Template][1]);
  }
}

function resolveText(m, next, prev, index = 0) {
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

function insertNode(newNode, refNode) {
  refNode.parentNode.insertBefore(newNode, refNode);
}

function stringify(vdom, values) {
  if (Array.isArray(vdom)) {
    return vdom.reduce((acc, v) => acc + stringify(v, values), "");
  } else if (vdom[Field] != null) {
    return stringify(values[vdom[Field]]);
  } else if (vdom[Template] != null) {
    return renderToString(vdom);
  } else if (!vdom.tag) {
    if (vdom == null) vdom = "";
    return String(vdom);
  } else {
    const { tag, props, children } = vdom;
    let s = `<${tag}`;
    if (props) {
      let r;
      let attrs = [];
      for (const name of Object.keys(props)) {
        if (name === "key") continue;
        let v = props[name];
        if (v[Field] != null) v = values[v[Field]];
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
      s += ">";
      s += children.reduce((acc, child) => acc + stringify(child, values), "");
      s += `</${tag}>`;
    } else {
      s += "/>";
    }
    return s;
  }
}
