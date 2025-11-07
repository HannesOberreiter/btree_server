import { defineBoot } from '#q-app/wrappers';
import { createI18n } from 'vue-i18n';
// using single import of json and not message auto import as it broke my vite HSMR and resulted in full page reloads
import { languages } from '../i18n';

import { useAuthUserStore } from '../stores/auth';

const i18n = createI18n({
	legacy: false, // you must set `false`, to use Composition API
	lang: 'en',
	fallbackLocale: 'en', // set fallback locale
	sync: true,
	globalInjection: true,
	messages: {
		'en': languages.en,
		'en-US': languages.en,
		'en-GB': languages.en,
		'de': languages.de,
		'de-DE': languages.de,
		'de-AT': languages.de,
		'fr': languages.fr,
		'fr-FR': languages.fr,
		'it': languages.it,
		'it-IT': languages.it,
	},
});

export default defineBoot(({ app }) => {
	const storeUser = useAuthUserStore();
	const lang = storeUser.getLanguage;
	i18n.global.locale.value = lang as any;
	app.use(i18n);
});

export { i18n };
