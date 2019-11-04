import { html, render, renderToString } from "../src";

const app = (name: string) => html`
  <div>Hello, ${name}</div>
`;

render(app("bar"), document.body);
render("string", document.body);
render(100, document.body);
render(true, document.body);
render([html``, "str", 10, false], document.body);

renderToString(app("foo"));
