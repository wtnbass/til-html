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
1947 B: til-html.js.gz
1741 B: til-html.js.br
1946 B: til-html.mjs.gz
1757 B: til-html.mjs.br
2021 B: til-html.umd.js.gz
1797 B: til-html.umd.js.br
```
