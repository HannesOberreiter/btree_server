import type { ComposerTranslation } from 'vue-i18n';
import { Notify } from 'quasar';
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { sleep } from '../helpers';

type Type = 'positive' | 'negative' | 'warning' | 'info' | 'ongoing';

type ApiError = {
  statusCode: number;
  code?: string;
  message?: string;
};

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'statusCode' in value &&
    typeof value.statusCode === 'number'
  );
}

const state = reactive({
  show: false,
  error: false
});

function useNotification(t?: ComposerTranslation) {
  const $t = t || useI18n().t;

  function useHandleSuccess(value: any) {
    const displayMessage = value ? $t(value) : '';
    return displayMessage;
  }

  function useHandleError(error: unknown) {
    let displayMessage = '';
    if (typeof error === 'string') {
      return $t(error);
    }
    if (!isApiError(error)) {
      return $t('error.unknown');
    }

    displayMessage = checkStatus(
      error.statusCode,
      error.message ?? '',
      error.code
    );
    if (displayMessage === '') {
      displayMessage = $t('error.unknown');
    }

    return displayMessage;
  }

  function checkStatus(
    statusCode: number,
    errorField = '',
    errorCode?: string
  ) {
    let displayMessage = '';
    if (statusCode === 400) {
      displayMessage = `${$t('error.unknown')} ${errorField}`;
    } else if (statusCode === 401) {
      if (errorField === 'mail') {
        displayMessage = $t('error.mailError');
      } else {
        displayMessage = $t('error.access');
      }
    } else if (statusCode === 402) {
      displayMessage = $t('error.premium');
    } else if (statusCode === 403) {
      if (errorField === 'lastMovement') {
        displayMessage = $t('error.lastMovement');
      } else {
        displayMessage = $t('error.forbidden');
      }
    } else if (statusCode === 404) {
      displayMessage = $t('error.notFound');
    } else if (statusCode === 409) {
      if (errorCode === 'FOREIGN_KEY_VIOLATION') {
        displayMessage = $t('error.unknown');
      } else if (errorField && errorField !== 'duplicate') {
        displayMessage = `${$t('error.duplicate')} (${$t(errorField)})`;
      } else {
        displayMessage = $t('error.duplicate');
      }
    } else if (statusCode === 423) {
      displayMessage = $t('error.locked');
    } else if (statusCode === 429) {
      displayMessage = $t('error.tooManyRequest');
    }

    return displayMessage;
  }

  function open(type: Type, message: any, isTranslated = false) {
    state.show = true;
    state.error = type === 'negative';
    let m = '';

    if (isTranslated) {
      // We already received a translated message, not need to translate it.
      m = message;
    } else {
      if (!message) {
        if (type === 'negative') {
          m = $t('error.unknown');
        } else if (type === 'positive') {
          m = $t('success');
        }
      } else {
        if (type === 'negative' && message) {
          m = useHandleError(message);
        } else if (type === 'positive' && message) {
          m = useHandleSuccess(message);
        } else {
          m = $t(message);
        }
      }
    }

    const dismiss = Notify.create({
      message: m,
      type,
      position: 'top',
      attrs: {
        'data-cy': 'notification'
      },
      actions: [
        {
          label: 'X',
          color: 'white',
          handler: () => {
            state.show = false;
          }
        }
      ]
    });
    const elements = document.getElementsByClassName('q-notification');
    void sleep(100).then(() => {
      for (let i = 0; i < elements.length; i++) {
        if (!elements[i]) {
          continue;
        }
        elements[i]!.addEventListener(
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
    close
  };
}

export { useNotification };
