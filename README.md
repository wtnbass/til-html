# til-html

WIP

- lightweight (aim to <2k~2.5k)
- powerful attributes(key, ref, prefixs("@", ".", "?"))
- SSR

## TODOs

- render
  - [x] Allow primitive values for the first argument
- SSR
  - [ ] `hydrate()`
- parse
  - [ ] ignore variable in comment
  - [ ] spread attributes variable
  - [ ] tag name as variable
  - [ ] attribute name as variable
- mutations
  - [x] `ref` props
  - [x] `key` props
- test
  - [ ] Do it

## Dev

below: Debugging on browser

```[sh]
npm run watch
python3 -m http.server
open http://localhost:8000/test/debug.html
```

## Size

From microbundle log

```[sh]
1949 B: til-html.js.gz
1737 B: til-html.js.br
1949 B: til-html.mjs.gz
1756 B: til-html.mjs.br
2024 B: til-html.umd.js.gz
1795 B: til-html.umd.js.br
```
