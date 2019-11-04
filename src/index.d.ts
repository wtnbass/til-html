declare const Template: unique symbol;

export type Template = {
  [Template]: [VDOM[], IArguments, Key | undefined];
};

export type VDOM = VNode | VText | undefined;

export type VNode = {
  tag: string;
  props?: { [name: string]: string | MutationIndex };
  children: VDOM[];
};

export type VText = string | MutationIndex;

export type MutationIndex = number;

export type Key = unknown;

export declare function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Template;

export declare function render(
  template: unknown,
  container: Element | DocumentFragment
): void;

export declare function renderToString(template: unknown): string;
