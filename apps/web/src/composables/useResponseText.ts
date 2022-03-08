/* eslint-disable @typescript-eslint/no-var-requires */
import { useAuthUserStore } from '../stores/auth';
import { reactive } from 'vue';
import { Notify } from 'quasar';

type Type = 'positive' | 'negative' | 'warning' | 'info';

const state = reactive({
  show: false,
  error: false,
});

const useNotification = () => {
  function open(type: Type, message: any) {
    state.show = true;
    state.error = type === 'negative' ? true : false;
    let m = '';
    if (!message) {
      if (type === 'negative') {
        m = 'An error occurred!';
      } else if (type === 'positive') {
        m = 'Success!';
      }
    } else {
      if (type === 'negative' && message) {
        m = useHandleError(message);
      } else if (type === 'positive' && message) {
        m = useHandleSuccess(message);
      } else {
        m = message;
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

const checkStatus = (statusCode: number) => {
  let displayMessage = '';
  if (statusCode === 423)
    displayMessage = 'Account locked! (too many login attempts?)';
  else if (statusCode === 401)
    displayMessage = 'Access not allowed or wrong password!';
  else if (statusCode === 409)
    displayMessage = 'Beekeeping name or e-mail already registered.';
  else if (statusCode === 403)
    displayMessage = 'Access forbidden or not allowed!';

  return displayMessage;
};

const useHandleError = (error: any) => {
  const storeUser = useAuthUserStore();
  const lang = storeUser.getLanguage;
  let displayMessage = '';
  if (typeof error === 'string') return error;
  if ('data' in error === false) {
    displayMessage = checkStatus(error.response.status);
  } else {
    if ('errors' in error.data) {
      if (typeof error.data.errors === 'string') {
        displayMessage = checkStatus(error.data.statusCode);
      } else if ('type' in error.data.errors) {
        // This error comes from Ajv Schema error
        // we actually want to prevent this in our backend
        // as the types should be already checked on the route
        // with express.validate
        displayMessage = checkStatus(error.data.statusCode);
        if (displayMessage === '') displayMessage = 'Validation error!';
      } else {
        if ('msgTranslation' in error.data.errors[0]) {
          displayMessage = error.data.errors[0].msgTranslation[lang];
          if ('paramTranslation' in error.data.errors[0])
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            displayMessage = `${displayMessage} (${error.data.errors[0].paramTranslation[lang]})`;
          if (error.data.errors.length > 1)
            displayMessage = 'One of the errors' + ': ' + displayMessage;
        }
      }
    }
  }

  if (displayMessage === '') displayMessage = 'Another error did occur.';

  return displayMessage;
};

const useHandleSuccess = (value: any) => {
  const displayMessage = value ? value : '';
  return displayMessage;
};

export { useHandleError, useHandleSuccess, useNotification };
