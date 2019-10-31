/* eslint-env mocha */
/* global expect, sinon */
import { html, render, renderToString } from "../src/index.js";

describe("render", () => {
  let container;

  function test(tmpl, innerHTML, htmlString) {
    render(tmpl, container);
    expect(container.innerHTML).to.equal(innerHTML, "render");
    expect(renderToString(tmpl)).to.equal(htmlString, "renderToString");
  }

  beforeEach(() => {
    container = document.body.appendChild(document.createElement("div"));
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("simple", () => {
    test(
      html`
        <div>Hello</div>
      `,
      `<div>Hello</div>`,
      `<div>Hello</div>`
    );
  });

  it("slash elements", () => {
    test(
      html`
        <div />
      `,
      "<div></div>",
      "<div></div>"
    );
  });

  it("void elements", () => {
    // prettier-ignore
    test(
      html`
        <input><input /><INPUT>
      `,
      "<input><input><input>",
      "<input><input><INPUT>"
    );
  });

  it("empty", () => {
    test(html``, "", "");
  });

  it("text", () => {
    test(
      html`
        <div>Hello, ${"world"}</div>
        <div>number, ${100}</div>
        <div>true, ${true}</div>
        <div>false, ${false}</div>
      `,
      "<div>Hello, world<!----></div>" +
        "<div>number, 100<!----></div>" +
        "<div>true, true<!----></div>" +
        "<div>false, false<!----></div>",
      "<div>Hello, world</div>" +
        "<div>number, 100</div>" +
        "<div>true, true</div>" +
        "<div>false, false</div>"
    );
  });

  it("attributes", () => {
    test(
      html`
        <div
          name="World"
          value=${"value"}
          data-num=${2}
          data-true=${true}
          data-false=${false}
          data-zero=${0}
          data-NaN=${NaN}
          data-null=${null}
          data-undefined=${undefined}
          key=${1}
        ></div>
      `,

      "<div" +
        ' name="World"' +
        ' value="value"' +
        ' data-num="2"' +
        ' data-true="true"' +
        ' data-false="false"' +
        ' data-zero="0"' +
        ' data-nan="NaN"' +
        ">" +
        "</div>",
      "<div" +
        ' name="World"' +
        ' value="value"' +
        ' data-num="2"' +
        ' data-true="true"' +
        ' data-false="false"' +
        ' data-zero="0"' +
        ' data-NaN="NaN"' +
        ">" +
        "</div>"
    );
  });

  it("ref function attribute", () => {
    let refNode;
    const app = html`
      <div ref=${node => (refNode = node)}></div>
    `;
    render(app, container);
    expect(container.querySelector("div")).to.equal(refNode);
  });

  it("ref object attribute", () => {
    const ref = { current: null };
    const app = html`
      <div ref=${ref}></div>
    `;
    render(app, container);
    expect(container.querySelector("div")).to.equal(ref.current);
  });

  it("spread attribute", () => {
    const cb = sinon.spy();
    const props = { a: 1, "?b": 2, ".c": 3, "@d": cb };

    const app = html`
      <div ...${props}></div>
    `;

    test(app, '<div a="1" b=""></div>', '<div a="1" b></div>');
  });

  it("boolean attribute", () => {
    test(
      html`
        <div ?yes=${true} ?no=${false}>Hello</div>
      `,
      `<div yes="">Hello</div>`,
      `<div yes>Hello</div>`
    );
  });

  it("property ", () => {
    const value = { name: "world" };
    test(
      html`
        <div .value=${value}>Hello</div>
      `,
      `<div>Hello</div>`,
      `<div>Hello</div>`
    );
    expect(container.querySelector("div").value).to.equal(value);
  });

  it("evnet handler", () => {
    const cb = sinon.spy();
    test(
      html`
        <button @click=${cb}>click</button>
      `,
      `<button>click</button>`,
      `<button>click</button>`
    );
    container.querySelector("button").click();
    expect(cb).called;
  });

  it("array", () => {
    test(
      html`
        <div>${["a", "b", "c"]}</div>
      `,
      `<div>abc<!----></div>`,
      `<div>abc</div>`
    );
  });

  it("template", () => {
    test(
      html`
        <div>
          ${["a", "b", "c"].map(
            s =>
              html`
                <input value=${s} />
              `
          )}
        </div>
      `,
      "<div>" +
        '<!----><input value="a"><!---->' +
        '<!----><input value="b"><!---->' +
        '<!----><input value="c"><!---->' +
        "<!----></div>",

      `<div><input value="a"><input value="b"><input value="c"></div>`
    );
  });

  it("falsy values", () => {
    test(
      html`
        <div>0, ${0}</div>
        <div>NaN, ${NaN}</div>
        <div>null, ${null}</div>
        <div>undefined, ${undefined}</div>
      `,
      "<div>0, 0<!----></div>" +
        "<div>NaN, NaN<!----></div>" +
        "<div>null, <!----></div>" +
        "<div>undefined, <!----></div>",
      "<div>0, 0</div>" +
        "<div>NaN, NaN</div>" +
        "<div>null, </div>" +
        "<div>undefined, </div>"
    );
  });

  it("raw string", () => {
    test("string", `string<!---->`, `string`);
  });

  it("raw number", () => {
    test(100, `100<!---->`, `100`);
  });

  it("raw boolean", () => {
    test(false, `false<!---->`, `false`);
  });

  it("raw array", () => {
    test(["a", "b", "c"], `abc<!---->`, `abc`);
  });

  it("raw null", () => {
    test(null, `<!---->`, ``);
  });

  it("raw undefined", () => {
    test(undefined, `<!---->`, ``);
  });
});
