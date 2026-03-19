import antfu from '@antfu/eslint-config';

export default antfu({

}, {
  rules: {
    'style/semi': ['error', 'always'],
    'no-console': 'off',
  },
}, {
  files: ['test/**/*.ts'],
  rules: {
    'no-restricted-globals': 'off',
    'no-undef': 'off',
  },
}, {
  files: ['db/**/*.js'],
  rules: {
    'e18e/prefer-static-regex': 'off',
  },
});
