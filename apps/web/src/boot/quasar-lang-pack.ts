import { Quasar } from 'quasar';
import langDe from 'quasar/lang/de';
import langEn from 'quasar/lang/en-US';
import { useAuthUserStore } from '../stores/auth';

export default () => {
  const storeUser = useAuthUserStore();
  try {
    Quasar.lang.set(storeUser.getLanguage === 'en' ? langEn : langDe);
  } catch (err) {
    // Requested Quasar Language Pack does not exist,
    // let's not break the app, so catching error
  }
};
