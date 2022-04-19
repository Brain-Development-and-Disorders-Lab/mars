module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  ignore: [
    ".eslintrc.js",
    "gulpfile.js",
    "jest.config.js",
    "webpack.*.js",
    "node_modules/",
    "*.d.ts",
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
};