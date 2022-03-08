import langDe from 'quasar/lang/de';
import langEn from 'quasar/lang/en-US';
import { useAuthUserStore } from '../stores/auth';

export const useQuasarLang = ($q: any) => {
  const storeUser = useAuthUserStore();
  $q.lang.set(storeUser.getLanguage === 'de' ? langDe : langEn);
};
