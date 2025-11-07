import { Quasar } from 'quasar';
import langDe from 'quasar/lang/de';
import langEn from 'quasar/lang/en-US';
import langFr from 'quasar/lang/fr';
import langIt from 'quasar/lang/it';

import { useAuthUserStore } from '../stores/auth';

export default () => {
	const storeUser = useAuthUserStore();
	try {
		let lang = langEn;
		switch (storeUser.getLanguage) {
			case 'de':
				lang = langDe;
				break;
			case 'it':
				lang = langIt;
				break;
			case 'fr':
				lang = langFr;
				break;
		}
		Quasar.lang.set(lang);
	}
	catch (err) {
		// Requested Quasar Language Pack does not exist,
		// let's not break the app, so catching error
		console.error(err);
		Quasar.lang.set(langEn);
	}
};
