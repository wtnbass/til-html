# til-html

WIP

- lightweight (aim to gzip size <2k~2.5k)
- powerful attributes(key, ref, prefixs("@", ".", "?"))
- SSR

## TODOs

- render
  - [x] Allow primitive values for the first argument
- SSR
  - [ ] `hydrate()`
- parse
  - [ ] ignore variables in comment
  - [ ] spread attributes variable
  - [ ] tag name as variable
  - [ ] attribute name as variable
- mutations
  - [x] `ref` props
  - [x] `key` props
- test
  - [ ] mount
  - [ ] parse
  - [ ] update
  - [ ] keys

## Size

From microbundle log

```[sh]
1950 B: til-html.js.gz
1735 B: til-html.js.br
1950 B: til-html.mjs.gz
1756 B: til-html.mjs.br
2025 B: til-html.umd.js.gz
1794 B: til-html.umd.js.br
```
