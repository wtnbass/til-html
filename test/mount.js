/* eslint-env mocha */
/* global expect, sinon */
import { html, render, renderToString } from "../src/index.js";

describe("mount", () => {
  let container;
  beforeEach(() => {
    container = document.body.appendChild(document.createElement("div"));
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("simple", () => {
    const app = html`
      <div>Hello</div>
    `;
    render(app, container);

    expect(`<div>Hello</div>`).to.equal(container.innerHTML);
    expect(`<div>Hello</div>`).to.equal(renderToString(app));
  });

  it("text", () => {
    const app = html`
      <div>Hello, ${"world"}</div>
    `;
    render(app, container);

    expect(`<div>Hello, world<!----></div>`).to.equal(container.innerHTML);
    expect(`<div>Hello, world</div>`).to.equal(renderToString(app));
  });

  it("attributes", () => {
    const app = html`
      <div id="greet" name="world" data-value="data" value=${"greet"}>
        Hello
      </div>
    `;
    render(app, container);

    expect(
      `<div id="greet" name="world" data-value="data" value="greet">Hello</div>`
    ).to.equal(container.innerHTML);
    expect(
      `<div id="greet" name="world" data-value="data" value="greet">Hello</div>`
    ).to.equal(renderToString(app));
  });

  it("boolean attribute", () => {
    const app = html`
      <div ?yes=${true} ?no=${false}>Hello</div>
    `;
    render(app, container);

    expect(`<div yes="">Hello</div>`).to.equal(container.innerHTML);
    expect(`<div yes>Hello</div>`).to.equal(renderToString(app));
  });

  it("property ", () => {
    const value = { name: "world" };
    const app = html`
      <div .value=${value}>Hello</div>
    `;
    render(app, container);

    expect(value).to.equal(container.querySelector("div").value);
    expect(`<div>Hello</div>`).to.equal(container.innerHTML);
    expect(`<div>Hello</div>`).to.equal(renderToString(app));
  });

  it("evnet handler", () => {
    const cb = sinon.spy();
    const app = html`
      <button @click=${cb}>click</button>
    `;
    render(app, container);
    container.querySelector("button").click();

    expect(cb).called;
    expect(`<button>click</button>`).to.equal(container.innerHTML);
    expect(`<button>click</button>`).to.equal(renderToString(app));
  });

  it("array", () => {
    const app = html`
      <div>${["a", "b", "c"]}</div>
    `;
    render(app, container);

    expect(`<div>abc<!----></div>`).to.equal(container.innerHTML);
    expect(`<div>abc</div>`).to.equal(renderToString(app));
  });

  it("template", () => {
    const app = html`
      <div>
        ${["a", "b", "c"].map(
          s =>
            html`
              <input value=${s} />
            `
        )}
      </div>
    `;
    render(app, container);

    expect(
      `<div><!----><input value="a"><!----><!----><input value="b"><!----><!----><input value="c"><!----><!----></div>`
    ).to.equal(container.innerHTML);
    expect(
      `<div><input value="a"><input value="b"><input value="c"></div>`
    ).to.equal(renderToString(app));
  });

  it("loose false values", () => {
    const app = html`
      <div>${["", 0, false]}</div>
    `;
    render(app, container);
    expect(`<div>0false<!----></div>`).to.equal(container.innerHTML);
    expect(`<div>0false</div>`).to.equal(renderToString(app));
  });

  it("raw string", () => {
    const app = "string";
    render(app, container);

    expect(`string<!---->`).to.equal(container.innerHTML);
    expect(`string`).to.equal(renderToString(app));
  });

  it("raw number", () => {
    const app = 100;
    render(app, container);

    expect(`100<!---->`).to.equal(container.innerHTML);
    expect(`100`).to.equal(renderToString(app));
  });

  it("raw boolean", () => {
    const app = false;
    render(app, container);

    expect(`false<!---->`).to.equal(container.innerHTML);
    expect(`false`).to.equal(renderToString(app));
  });

  it("raw array", () => {
    const app = ["a", "b", "c"];
    render(app, container);

    expect(`abc<!---->`).to.equal(container.innerHTML);
    expect(`abc`).to.equal(renderToString(app));
  });
});
