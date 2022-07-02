# prettier-plugin-stylus

[Prettier](https://prettier.io/) plugin for [Stylus](https://stylus-lang.com/).

![Demo](demo.png)

## Usage

```sh
npm i prettier-plugin-stylus
```

Then add it to your prettierrc file, e.g.:

```json
{
  "plugins": ["prettier-plugin-stylus"],
  "trailingComma": "all"
}
```

Or you can specify it in command line:

```sh
npx prettier --plugin=prettier-plugin-stylus some.styl
```

## TODO

- [ ] use vitest for tests
- [ ] @font-face
- [ ] object/hashes
- [ ] add plugin recommendation in prettier docs
- [ ] Vue SFC (Waiting for upstream, see https://github.com/prettier/prettier/pull/12707)
- [ ] playground
