/* eslint-env mocha */
/* global expect */
import { html } from "../src/index.js";

describe("parse", () => {
  let container;
  const t = html`
    ${0}
  `;
  const Template = Object.getOwnPropertySymbols(t)[0];
  const Field = Object.getOwnPropertySymbols(t[Template][0][0])[0];

  beforeEach(() => {
    container = document.body.appendChild(document.createElement("div"));
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function test(tmpl, vdom, variables, key) {
    expect(vdom).to.deep.equal(tmpl[Template][0], "vdom");
    if (variables) {
      expect(variables).to.deep.equal(
        Array.from(tmpl[Template][1]).slice(1),
        "variables"
      );
    }
    if (key != null) {
      expect(key).to.equal(tmpl[Template][2], "key");
    }
  }

  function field(pos) {
    return { [Field]: pos };
  }

  it("single", () => {
    const app = html`
      <div>hello</div>
    `;

    test(app, [{ tag: "div", children: ["hello"] }]);
  });

  it("multiple", () => {
    const app = html`
      <div>hello</div>
      <div>world</div>
    `;

    test(app, [
      { tag: "div", children: ["hello"] },
      { tag: "div", children: ["world"] }
    ]);
  });

  it("has attribute", () => {
    const app = html`
      <div name="greet">hello</div>
    `;

    test(app, [{ tag: "div", props: { name: "greet" }, children: ["hello"] }]);
  });

  it("has text variables", () => {
    const app = html`
      <div>hello, ${"world"}, ${1000}</div>
    `;

    test(
      app,
      [{ tag: "div", children: ["hello, ", field(1), ", ", field(2)] }],
      ["world", 1000]
    );
  });

  it("has attribute variables", () => {
    const cb = () => {};
    const app = html`
      <div
        name="greet"
        class=${"wrapper"}
        @click=${cb}
        .value=${"value"}
        ?yes=${true}
      >
        hello
      </div>
    `;

    test(
      app,
      [
        {
          tag: "div",
          props: {
            name: "greet",
            class: field(1),
            "@click": field(2),
            ".value": field(3),
            "?yes": field(4)
          },
          children: ["hello"]
        }
      ],
      ["wrapper", cb, "value", true]
    );
  });

  it("has static key", () => {
    const app = html`
      <div key="99">hello</div>
    `;

    test(
      app,
      [{ tag: "div", props: { key: "99" }, children: ["hello"] }],
      [],
      "99"
    );
  });

  it("has variable key", () => {
    const app = html`
      <div key=${80}>hello</div>
    `;

    test(
      app,
      [{ tag: "div", props: { key: field(1) }, children: ["hello"] }],
      [80],
      80
    );
  });

  it("closed elements", () => {
    const app = html`
      <div class="test" />
    `;

    test(app, [{ tag: "div", props: { class: "test" }, children: [] }]);
  });

  it("ignore unexpected enclosing tag", () => {
    const app = html`
      <div><p><b></p></b></div></main>
    `;

    test(app, [
      {
        tag: "div",
        children: [{ tag: "p", children: [{ tag: "b", children: [] }] }]
      }
    ]);
  });

  it("ugly attributes", () => {
    // prettier-ignore
    const app = html`
      <div name  =  "a" id  = 'b' class = c  color =  d></div>
    `
    test(app, [
      {
        tag: "div",
        props: {
          name: "a",
          id: "b",
          class: "c",
          color: "d"
        },
        children: []
      }
    ]);
  });

  it("doctype", () => {
    const app = html`
      <!DOCTYPE html>
      <div>doctype</div>
    `;

    test(app, [{ tag: "div", children: ["doctype"] }]);
  });

  it("comment", () => {
    const app = html`
      <!-- comment -->
      <div>comment</div>
      <!--  -->
      <!-->
    `;
    test(app, [{ tag: "div", children: ["comment"] }]);
  });
  it("invalid comment", () => {
    const app = html`
      <div><!-- ->in comment --></div>
      <div><!- --></div>
    `;
    test(app, [
      { tag: "div", children: [] },
      { tag: "div", children: ["<!- -->"] }
    ]);
  });

  it("ignore variables in comment", () => {
    const app = html`
      <!-- ${0} -->
    `;
    test(app, [], [0]);
  });
});
