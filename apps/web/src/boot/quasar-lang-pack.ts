import { Quasar } from 'quasar';
import { useAuthUserStore } from '../stores/auth';

export default async () => {
  const storeUser = useAuthUserStore();
  const lang = storeUser.getLanguage;
  const langIso = lang === 'en' ? 'en-US' : lang;
  try {
    await import(
      /* webpackInclude: /(de|en-US)\.js$/ */
      'quasar/lang/' + langIso
    ).then((lang) => {
      Quasar.lang.set(lang.default);
    });
  } catch (err) {
    // Requested Quasar Language Pack does not exist,
    // let's not break the app, so catching error
  }
};
