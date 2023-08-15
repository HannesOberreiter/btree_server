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
    let displayMessage = '';
    if (typeof error === 'string') return t(error);

    let errorMessage;

    if ('message' in error) {
      errorMessage = error.message;
    } else if ('errors' in error) {
      errorMessage = error.errors;
    } else if ('error' in error) {
      errorMessage = error.error;
    }
    displayMessage = checkStatus(error.statusCode, errorMessage);
    if (displayMessage === '') displayMessage = t('error.unknown');

    return displayMessage;
  }

  function checkStatus(statusCode: number, errorField = '') {
    let displayMessage = '';

    if (statusCode === 401) {
      if (errorField === 'mail') {
        displayMessage = t('error.mailError');
      } else {
        displayMessage = t('error.access');
      }
    } else if (statusCode === 402) displayMessage = t('error.premium');
    else if (statusCode === 403) {
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
          true,
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
