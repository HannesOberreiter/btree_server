import { boot } from 'quasar/wrappers';
import { createI18n } from 'vue-i18n';
// import { useAuthUserStore } from '../stores/auth';
import messages from 'src/i18n';

let i18n = createI18n({
  legacy: false, // you must set `false`, to use Composition API
});

export default boot(({ app }) => {
  // const storeUser = useAuthUserStore();
  // const lang = storeUser.getLanguage;

  // for dev we only use englisch
  const lang = 'en';

  i18n = createI18n({
    legacy: false, // you must set `false`, to use Composition API
    locale: lang,
    fallbackLocale: 'en', // set fallback locale
    messages,
  });

  // Set i18n instance on app
  app.use(i18n);
});

export { i18n };
