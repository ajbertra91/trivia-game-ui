# Trivia Game UI

![built with graphQL](https://img.shields.io/badge/built_with-hyperhtml-blue.svg)

![built with graphQL](https://img.shields.io/badge/built_with-graphQL-blue.svg)

A simple trivia game build with hyperhtml and graphQL.

## Demo
[Trivia Game](https://ajbertra91.github.io/trivia-game/)

## Getting started

```bash
npm install
```

The `public/index.html` file contains a `<script src='bundle.js'>` tag, which means we need to create `public/bundle.js`. The `rollup.config.js` file tells Rollup how to create this bundle, starting with `src/main.js` and including all its dependencies.

`npm run build` builds the application to `public/bundle.js`, along with a sourcemap file for debugging.

`npm start` launches a server, using [serve](https://github.com/zeit/serve). Navigate to [localhost:3000](http://localhost:3000).

`npm run watch` will continually rebuild the application as your source files change.

`npm run dev` will run `npm start` and `npm run watch` in parallel.

## License

[MIT](LICENSE).
