import antfu from '@antfu/eslint-config';
import pluginQuasar from '@quasar/app-vite/eslint';
import globals from 'globals';

export default antfu(
	{
		type: 'app',
		vue: true,
		typescript: true,
		stylistic: {
			indent: 'tab',
			quotes: 'single',
			semi: true,
		},
		rules: {
			'no-console': 'off',
			'node/prefer-global/process': 'off',
		},
		ignores: ['**/*.md'],
	},
	...pluginQuasar.configs.recommended(),
	{
		files: ['src-pwa/custom-service-worker.ts'],
		languageOptions: {
			globals: {
				...globals.serviceworker,
			},
		},
	},
);
