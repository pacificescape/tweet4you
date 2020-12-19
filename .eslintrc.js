module.exports = {
    env: {
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
      ecmaVersion: 2020,
      sourceType: 'module'
    }
  }
