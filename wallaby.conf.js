module.exports = (wallaby) => {
  process.env.NODE_ENV = 'development'

  return {
    files: [
      './**/*.js'
    ],

    tests: [
      './tests/**/*.js'
    ],

    env: {
      type: 'node'
    },

    debug: true,

    compilers: {
      '**/*.js': wallaby.compilers.babel(),
      testFramework: "ava"
    }
  }
}
