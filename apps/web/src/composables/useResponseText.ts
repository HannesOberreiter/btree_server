import { useAuthUserStore } from '~/stores/auth';
import { reactive } from 'vue';
import { Notify } from 'quasar';
import { useI18n } from 'vue-i18n';

type Type = 'positive' | 'negative' | 'warning' | 'info';

const state = reactive({
  show: false,
  error: false,
});

const useNotification = () => {
  const { t } = useI18n();

  function useHandleSuccess(value: any) {
    const displayMessage = value ? t(value) : '';
    return displayMessage;
  }

  function useHandleError(error: any) {
    const storeUser = useAuthUserStore();
    const lang = storeUser.getLanguage;
    let displayMessage = '';

    if (typeof error === 'string') return t(error);
    if ('data' in error === false) {
      displayMessage = checkStatus(error.response.status);
    } else {
      if ('errors' in error.data) {
        if (typeof error.data.errors === 'string') {
          displayMessage = checkStatus(
            error.data.statusCode,
            error.data.errors
          );
        } else if ('type' in error.data.errors) {
          // This error comes from Ajv Schema error
          // we actually want to prevent this in our backend
          // as the types should be already checked on the route
          // with express.validate
          displayMessage = checkStatus(error.data.statusCode);
          if (displayMessage === '') displayMessage = t('error.validation');
        } else {
          if ('msgTranslation' in error.data.errors[0]) {
            displayMessage = error.data.errors[0].msgTranslation[lang];
            if ('paramTranslation' in error.data.errors[0])
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              displayMessage = `${displayMessage} (${error.data.errors[0].paramTranslation[lang]})`;
            if (error.data.errors.length > 1)
              displayMessage = t('error.more') + ': ' + displayMessage;
          }
        }
      }
    }

    if (displayMessage === '') displayMessage = t('error.unknown');

    return displayMessage;
  }

  function checkStatus(statusCode: number, errorField = '') {
    let displayMessage = '';

    if (statusCode === 401) displayMessage = t('error.access');
    else if (statusCode === 402) displayMessage = t('error.premium');
    else if (statusCode === 403) displayMessage = t('error.forbidden');
    else if (statusCode === 404) displayMessage = t('error.notFound');
    else if (statusCode === 409)
      displayMessage = `${t('error.duplicate')} (${t(errorField)})`;
    else if (statusCode === 423) displayMessage = t('error.locked');

    return displayMessage;
  }

  function open(type: Type, message: any) {
    state.show = true;
    state.error = type === 'negative' ? true : false;
    let m = '';
    if (!message) {
      if (type === 'negative') {
        m = t('error.unknown');
      } else if (type === 'positive') {
        m = t('success');
      }
    } else {
      if (type === 'negative' && message) {
        m = useHandleError(message);
      } else if (type === 'positive' && message) {
        m = useHandleSuccess(message);
      } else {
        m = t(message);
      }
    }

    Notify.create({
      message: m,
      type: type,
      position: 'top',
      actions: [
        {
          label: 'X',
          color: 'white',
          handler: () => {
            state.show = false;
          },
        },
      ],
    });
  }
  function close() {
    state.show = false;
    state.error = false;
  }
  return {
    state,
    open,
    close,
  };
};

export { useNotification };
