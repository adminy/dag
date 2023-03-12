module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:import/recommended'],
  overrides: [],
  parserOptions: {
    sourceType: 'module',
  },
  rules: {
    'import/no-cycle': 'error',
    // make sure that all files have an extension (required by ESM)
    'import/extensions': [
      'error',
      'always',
      {
        js: 'always',
        jsx: 'never',
        mjs: 'always',
      },
    ],
  },
  settings: {
    'import/ignore': [
      // for some reason, `import {it} from "vitest";` throws an error
      /node_modules\/vitest\/dist\/index\.js$/.source,
    ],
  },
};
