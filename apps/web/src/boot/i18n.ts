import { boot } from 'quasar/wrappers';
import { Composer, createI18n, Locale, VueI18n as VueI18nType } from 'vue-i18n';
import { useAuthUserStore } from '~/stores/auth';

// using single import of json and not message auto import as it broke my vite HSMR and resulted in full page reloads
import de from '~/i18n/de/index.json';
import en from '~/i18n/en/index.json';

const i18n = createI18n({
  legacy: false, // you must set `false`, to use Composition API
  lang: 'en',
  fallbackLocale: 'en', // set fallback locale
  sync: true,
  globalInjection: true,
  messages: {
    en: en,
    de: de,
  },
});

export function getLocale(i18n: any): string {
  return i18n.mode === 'legacy'
    ? (i18n.global as unknown as VueI18nType).locale
    : (i18n.global as unknown as Composer).locale.value;
}

export function setLocale(i18n: any, locale: Locale): void {
  if (i18n.mode === 'legacy') {
    (i18n.global as unknown as VueI18nType).locale = locale;
  } else {
    (i18n.global as unknown as Composer).locale.value = locale;
  }
  i18n.locale = locale;
}

export default boot(({ app }) => {
  const storeUser = useAuthUserStore();
  const lang = storeUser.getLanguage;
  setLocale(i18n, lang);
  // Set i18n instance on app
  app.use(i18n);
});

export { i18n };
