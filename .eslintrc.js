module.exports = {
    env: {
      es6: true,
      node: true
    },
    extends: [
      'standard'
    ],
    globals: {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    plugins: [],
    parserOptions: {
      ecmaVersion: 2018,
      sourceType: 'module'
    }
  }
