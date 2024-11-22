import antfu from '@antfu/eslint-config';

export default antfu({

}, {
  rules: {
    'style/semi': ['error', 'always'],
    'no-console': 'off',
  },
}, {
  files: ['test/**/*.cjs'],
  rules: {
    'no-restricted-globals': 'off',
    'no-undef': 'off',
  },
});
