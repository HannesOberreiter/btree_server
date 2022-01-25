module.exports = {
  root: true,
  env: {
    node: true
  },
  rules: {
    "no-unused-vars": "off",
     // note you must disable the base rule as it can report incorrect errors
    '@typescript-eslint/no-unused-vars': [
      'warn', 
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ]
  },
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
};