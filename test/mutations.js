/* eslint-env mocha */
/* global expect, sinon */
import { html, render } from "../src/index.js";

describe("mutations", () => {
  let container;

  beforeEach(() => {
    container = document.body.appendChild(document.createElement("div"));
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("text", () => {
    const app = text => html`
      <div>${text}</div>
    `;

    render(app("string"), container);
    expect(container.querySelector("div").innerText).to.equal("string");

    render(app("change"), container);
    expect(container.querySelector("div").innerText).to.equal("change");

    render(app(1000), container);
    expect(container.querySelector("div").innerText).to.equal("1000");

    render(app(true), container);
    expect(container.querySelector("div").innerText).to.equal("true");

    render(app(false), container);
    expect(container.querySelector("div").innerText).to.equal("false");
  });

  it("text array", () => {
    const app = (...args) => html`
      <div>${args}</div>
    `;

    // first
    render(app("a", "b", "c"), container);
    expect(container.querySelector("div").innerText).to.equal("abc");

    // change
    render(app("d", "e", "f"), container);
    expect(container.querySelector("div").innerText).to.equal("def");

    // add
    render(app("d", "e", "f", "g", "h"), container);
    expect(container.querySelector("div").innerText).to.equal("defgh");

    // remove
    render(app("e", "f", "g"), container);
    expect(container.querySelector("div").innerText).to.equal("efg");

    // remove and insert
    render(app("z", "e", "g", "a", "b"), container);
    expect(container.querySelector("div").innerText).to.equal("zegab");
  });

  it("template", () => {
    const app = inner => html`
      <div>
        ${html`
          <p>${inner}</p>
        `}
      </div>
    `;

    render(app("foo"), container);
    expect(container.querySelector("div").innerHTML).to.equal(
      "<!----><p>foo<!----></p><!----><!---->"
    );

    render(app("bar"), container);
    expect(container.querySelector("div").innerHTML).to.equal(
      "<!----><p>bar<!----></p><!----><!---->"
    );
  });

  it("template array with key", () => {
    const app = items => html`
      <ul>
        ${items.map(
          item => html`
            <li key=${item.id}>${item.content}</li>
          `
        )}
      </ul>
    `;

    render(
      app([
        { id: 1, content: "aaa" },
        { id: 2, content: "bbb" },
        { id: 3, content: "ccc" },
        { id: 4, content: "ddd" },
        { id: 5, content: "eee" }
      ]),
      container
    );

    const [li1_1, li1_2, li1_3, li1_4, li1_5] = container
      .querySelector("ul")
      .querySelectorAll("li");

    expect(li1_1.innerText).to.equal("aaa");
    expect(li1_2.innerText).to.equal("bbb");
    expect(li1_3.innerText).to.equal("ccc");
    expect(li1_4.innerText).to.equal("ddd");
    expect(li1_5.innerText).to.equal("eee");

    // insert
    render(
      app([
        { id: 8, content: "hhh" },
        { id: 1, content: "aaa" },
        { id: 2, content: "bbb" },
        { id: 3, content: "ccc" },
        { id: 6, content: "fff" },
        { id: 4, content: "ddd" },
        { id: 5, content: "eee" },
        { id: 7, content: "ggg" }
      ]),
      container
    );
    let [
      li2_8,
      li2_1,
      li2_2,
      li2_3,
      li2_6,
      li2_4,
      li2_5,
      li2_7
    ] = container.querySelector("ul").querySelectorAll("li");

    expect(li2_8.innerText).to.equal("hhh");
    expect(li2_1.innerText).to.equal("aaa");
    expect(li2_2.innerText).to.equal("bbb");
    expect(li2_3.innerText).to.equal("ccc");
    expect(li2_6.innerText).to.equal("fff");
    expect(li2_4.innerText).to.equal("ddd");
    expect(li2_5.innerText).to.equal("eee");
    expect(li2_7.innerText).to.equal("ggg");

    expect(li2_1).to.equal(li1_1);
    expect(li2_2).to.equal(li1_2);
    expect(li2_3).to.equal(li1_3);
    expect(li2_4).to.equal(li1_4);
    expect(li2_5).to.equal(li1_5);

    // delete
    render(
      app([
        { id: 8, content: "hhh" },
        { id: 6, content: "fff" },
        { id: 4, content: "ddd" },
        { id: 5, content: "eee" }
      ]),
      container
    );
    let [li3_8, li3_6, li3_4, li3_5] = container
      .querySelector("ul")
      .querySelectorAll("li");

    expect(li3_8.innerText).to.equal("hhh");
    expect(li3_6.innerText).to.equal("fff");
    expect(li3_4.innerText).to.equal("ddd");
    expect(li3_5.innerText).to.equal("eee");

    expect(li3_8).to.equal(li2_8);
    expect(li3_6).to.equal(li2_6);
    expect(li3_4).to.equal(li2_4);
    expect(li3_5).to.equal(li2_5);

    // delete and insert
    render(
      app([
        { id: 8, content: "hhh" },
        { id: 4, content: "ddd" },
        { id: 9, content: "iii" },
        { id: 5, content: "eee" },
        { id: 10, content: "jjj" }
      ]),
      container
    );
    let [li4_8, li4_4, li4_9, li4_5, li4_10] = container
      .querySelector("ul")
      .querySelectorAll("li");

    expect(li4_8.innerText).to.equal("hhh");
    expect(li4_4.innerText).to.equal("ddd");
    expect(li4_9.innerText).to.equal("iii");
    expect(li4_5.innerText).to.equal("eee");
    expect(li4_10.innerText).to.equal("jjj");

    expect(li4_8).to.equal(li3_8);
    expect(li4_4).to.equal(li3_4);
    expect(li4_5).to.equal(li3_5);
  });

  it("template array without key", () => {
    const app = items => html`
      <ul>
        ${items.map(
          item => html`
            <li>${item.content}</li>
          `
        )}
      </ul>
    `;

    render(
      app([
        { id: 1, content: "aaa" },
        { id: 2, content: "bbb" },
        { id: 3, content: "ccc" },
        { id: 4, content: "ddd" },
        { id: 5, content: "eee" }
      ]),
      container
    );

    const [li1_1, li1_2, li1_3, li1_4, li1_5] = container
      .querySelector("ul")
      .querySelectorAll("li");

    expect(li1_1.innerText).to.equal("aaa");
    expect(li1_2.innerText).to.equal("bbb");
    expect(li1_3.innerText).to.equal("ccc");
    expect(li1_4.innerText).to.equal("ddd");
    expect(li1_5.innerText).to.equal("eee");

    // insert
    render(
      app([
        { id: 8, content: "hhh" },
        { id: 1, content: "aaa" },
        { id: 2, content: "bbb" },
        { id: 3, content: "ccc" },
        { id: 6, content: "fff" },
        { id: 4, content: "ddd" },
        { id: 5, content: "eee" },
        { id: 7, content: "ggg" }
      ]),
      container
    );
    let [
      li2_8,
      li2_1,
      li2_2,
      li2_3,
      li2_6,
      li2_4,
      li2_5,
      li2_7
    ] = container.querySelector("ul").querySelectorAll("li");

    expect(li2_8.innerText).to.equal("hhh");
    expect(li2_1.innerText).to.equal("aaa");
    expect(li2_2.innerText).to.equal("bbb");
    expect(li2_3.innerText).to.equal("ccc");
    expect(li2_6.innerText).to.equal("fff");
    expect(li2_4.innerText).to.equal("ddd");
    expect(li2_5.innerText).to.equal("eee");
    expect(li2_7.innerText).to.equal("ggg");

    expect(li2_8).to.equal(li1_1);
    expect(li2_1).to.equal(li1_2);
    expect(li2_2).to.equal(li1_3);
    expect(li2_3).to.equal(li1_4);
    expect(li2_6).to.equal(li1_5);

    // delete
    render(
      app([
        { id: 8, content: "hhh" },
        { id: 6, content: "fff" },
        { id: 4, content: "ddd" },
        { id: 5, content: "eee" }
      ]),
      container
    );
    let [li3_8, li3_6, li3_4, li3_5] = container
      .querySelector("ul")
      .querySelectorAll("li");

    expect(li3_8.innerText).to.equal("hhh");
    expect(li3_6.innerText).to.equal("fff");
    expect(li3_4.innerText).to.equal("ddd");
    expect(li3_5.innerText).to.equal("eee");

    expect(li3_8).to.equal(li2_8);
    expect(li3_6).to.equal(li2_1);
    expect(li3_4).to.equal(li2_2);
    expect(li3_5).to.equal(li2_3);

    // delete and insert
    render(
      app([
        { id: 8, content: "hhh" },
        { id: 4, content: "ddd" },
        { id: 9, content: "iii" },
        { id: 5, content: "eee" },
        { id: 10, content: "jjj" }
      ]),
      container
    );
    let [li4_8, li4_4, li4_9, li4_5, li4_10] = container
      .querySelector("ul")
      .querySelectorAll("li");

    expect(li4_8.innerText).to.equal("hhh");
    expect(li4_4.innerText).to.equal("ddd");
    expect(li4_9.innerText).to.equal("iii");
    expect(li4_5.innerText).to.equal("eee");
    expect(li4_10.innerText).to.equal("jjj");

    expect(li4_8).to.equal(li3_8);
    expect(li4_4).to.equal(li3_6);
    expect(li4_9).to.equal(li3_4);
    expect(li4_5).to.equal(li3_5);
  });

  it("attribute", () => {
    const app = (name, bool, value, onclick) => html`
      <div name=${name} ?bool=${bool} .value=${value} @click=${onclick}>
        attributes
      </div>
    `;

    const cb1 = sinon.spy();
    render(app("Alice", false, 100, cb1), container);
    const div = container.querySelector("div");
    div.click();

    expect(div.getAttribute("name")).to.equal("Alice");
    expect(div.hasAttribute("bool")).to.equal(false);
    expect(div.value).to.equal(100);
    expect(cb1).calledOnce;

    const cb2 = sinon.spy();
    render(app("Bob", true, 200, cb2), container);
    div.click();

    expect(div.getAttribute("name")).to.equal("Bob");
    expect(div.hasAttribute("bool")).to.equal(true);
    expect(div.value).to.equal(200);
    expect(cb2).calledOnce;
    expect(cb1).calledOnce;
  });

  it("spread attribute", () => {
    const app = props => html`
      <div ...${props}>
        attributes
      </div>
    `;

    const cb1 = sinon.spy();
    render(
      app({ name: "Alice", "?bool": true, ".value": 100, "@click": cb1 }),
      container
    );
    const div = container.querySelector("div");
    div.click();

    expect(div.getAttribute("name")).to.equal("Alice");
    expect(div.hasAttribute("bool")).to.equal(true);
    expect(div.value).to.equal(100);
    expect(cb1).calledOnce;

    const cb2 = sinon.spy();
    render(
      app({ name: "Bob", "?bool": false, ".value": 200, "@click": cb2 }),
      container
    );
    div.click();

    expect(div.getAttribute("name")).to.equal("Bob");
    expect(div.hasAttribute("bool")).to.equal(false);
    expect(div.value).to.equal(200);
    expect(cb2).calledOnce;
    expect(cb1).calledOnce;
  });

  it("unsafe html", () => {
    const app = () => html`
      <div unsafe-html=${"<span>unsafe</span>"}>
        ignored
      </div>
    `;
    render(app(), container);
    const span1 = container.querySelector("div").querySelector("span");
    expect(span1.innerText).to.equal("unsafe");

    render(app(), container);
    const span2 = container.querySelector("div").querySelector("span");
    expect(span2.innerText).to.equal("unsafe");
    expect(span2).to.equal(span1);
  });
});
