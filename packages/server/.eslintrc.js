module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: ['eslint-config-airbnb-base', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'max-classes-per-file': 'off',
    'no-prototype-builtins': 'off',
    'no-restricted-syntax': 'off',
    'no-use-before-define': 'off',
    'no-unused-expressions': 'off',
    quotes: ['error', 'single'],
    'no-console': 'off',
    'lines-between-class-members': 'off',
  },
};
