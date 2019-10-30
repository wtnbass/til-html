# til-html

WIP

- lightweight (aim to gzip size <2.5k)
- powerful attributes(key, ref, prefixs("@", ".", "?"))
- SSR

## TODOs

- parse
  - [x] ignore variables in comment
  - [ ] spread attributes variable
  - [ ] tag name as variable
  - [ ] attribute name as variable
- test
  - [ ] render
  - [ ] parse
  - [ ] mutations
  - [ ] keys
- SSR
  - [ ] `hydrate()`
  - [ ] separate `renderToString()` to server.js

## Size

From microbundle log

```[sh]
2024 B: til-html.js.gz
1818 B: til-html.js.br
2013 B: til-html.mjs.gz
1829 B: til-html.mjs.br
2095 B: til-html.umd.js.gz
1873 B: til-html.umd.js.br
```
