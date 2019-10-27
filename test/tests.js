import { html, render, renderToString } from "../src/index.js";

const container = document.createElement("div");
document.body.appendChild(container);

describe("test", () => {
  test("simple", () => {
    const app = html`
      <div>Hello</div>
    `;
    render(app, container);

    expect(container.innerHTML).to.equal("<div>Hello</div>");
    expect(renderToString(app)).to.equal("<div>Hello</div>");
  });
});
