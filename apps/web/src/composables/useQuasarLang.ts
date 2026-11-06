import langDe from 'quasar/lang/de';
import langEn from 'quasar/lang/en-US';
import langFr from 'quasar/lang/fr';
import langIt from 'quasar/lang/it';
import { useAuthUserStore } from '../stores/auth';

export function useQuasarLang($q: any) {
  const storeUser = useAuthUserStore();
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
  $q.lang.set(lang);
}
