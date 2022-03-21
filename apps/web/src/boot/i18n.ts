import { boot } from 'quasar/wrappers';
import { Composer, createI18n, Locale, VueI18n } from 'vue-i18n';
import { useAuthUserStore } from '../stores/auth';
import messages from '../i18n';

export const i18n = createI18n({
  legacy: false, // you must set `false`, to use Composition API
  fallbackLocale: 'en', // set fallback locale
  sync: true,
  globalInjection: true,
  messages,
});

export function getLocale(i18n: any): string {
  return i18n.mode === 'legacy'
    ? (i18n.global as unknown as VueI18n).locale
    : (i18n.global as unknown as Composer).locale.value;
}

export function setLocale(i18n: any, locale: Locale): void {
  if (i18n.mode === 'legacy') {
    (i18n.global as unknown as VueI18n).locale = locale;
  } else {
    (i18n.global as unknown as Composer).locale.value = locale;
  }
}

export default boot(({ app }) => {
  const storeUser = useAuthUserStore();
  const lang = storeUser.getLanguage;
  setLocale(i18n, lang);

  // Set i18n instance on app
  app.use(i18n);
});
