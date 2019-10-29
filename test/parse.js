/* eslint-env mocha */
/* global expect */
import { html, render, renderToString } from "../src/index.js";

describe("parse", () => {
  let container;
  beforeEach(() => {
    container = document.body.appendChild(document.createElement("div"));
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("doctype", () => {
    const app = html`
      <!DOCTYPE html>
      <div>doctype</div>
    `;
    render(app, container);

    expect(`<div>doctype</div>`).to.equal(container.innerHTML);
    expect(`<div>doctype</div>`).to.equal(renderToString(app));
  });

  it("comment", () => {
    const app = html`
      <!-- comment -->
      <div>comment</div>
    `;
    render(app, container);

    expect(`<div>comment</div>`).to.equal(container.innerHTML);
    expect(`<div>comment</div>`).to.equal(renderToString(app));
  });
});
