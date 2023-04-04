import { useAuthUserStore } from '~/stores/auth';
import { reactive } from 'vue';
import { Notify } from 'quasar';
import { useI18n } from 'vue-i18n';
import { sleep } from '~/helpers';

type Type = 'positive' | 'negative' | 'warning' | 'info' | 'ongoing';

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

    if ('errors' in error) {
      if (typeof error.errors === 'string') {
        displayMessage = checkStatus(error.statusCode, error.errors);
      } else if ('type' in error.errors) {
        // This error comes from Ajv Schema error
        // we actually want to prevent this in our backend
        // as the types should be already checked on the route
        // with express.validate
        displayMessage = checkStatus(error.statusCode);
        if (displayMessage === '') displayMessage = t('error.validation');
      } else {
        if ('msgTranslation' in error.errors[0]) {
          displayMessage = error.errors[0].msgTranslation[lang];
          if ('paramTranslation' in error.errors[0])
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            displayMessage = `${displayMessage} (${error.errors[0].paramTranslation[lang]})`;
          if (error.errors.length > 1)
            displayMessage = t('error.more') + ': ' + displayMessage;
        }
      }
    }

    if (displayMessage === '') displayMessage = t('error.unknown');

    return displayMessage;
  }

  function checkStatus(statusCode: number, errorField = '') {
    let displayMessage = '';

    if (statusCode === 401) {
      displayMessage = t('error.access');
    } else if (statusCode === 402) displayMessage = t('error.premium');
    else if (statusCode === 403) {
      console.log(errorField);
      if (errorField === 'lastMovement') {
        displayMessage = t('error.lastMovement');
      } else {
        displayMessage = t('error.forbidden');
      }
    } else if (statusCode === 404) displayMessage = t('error.notFound');
    else if (statusCode === 409)
      displayMessage = `${t('error.duplicate')} (${t(errorField)})`;
    else if (statusCode === 423) displayMessage = t('error.locked');
    else if (statusCode === 429) displayMessage = t('error.tooManyRequest');

    return displayMessage;
  }

  function open(type: Type, message: any, isTranslated = false) {
    state.show = true;
    state.error = type === 'negative' ? true : false;
    let m = '';

    if (isTranslated) {
      // We already received a translated message, not need to translate it.
      m = message;
    } else {
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
    }

    const dismiss = Notify.create({
      message: m,
      type: type,
      position: 'top',
      attrs: {
        'data-cy': 'notification',
      },
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
    const elements = document.getElementsByClassName('q-notification');
    sleep(100).then(() => {
      for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener(
          'click',
          () => {
            dismiss();
          },
          true
        );
      }
    });
    return dismiss;
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
