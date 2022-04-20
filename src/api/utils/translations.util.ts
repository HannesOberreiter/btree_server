import { map } from 'lodash';

const messageTranslation = {
  requiredField: {
    de: 'test',
    en: 'try'
  },
  wrongLogin: {
    de: 'Falsches Passwort oder E-Mail.',
    en: 'Wrong passwort or email.'
  },
  'Invalid value': {
    de: 'Falscher Wert',
    en: 'Invalid value'
  }
};

const fieldTranslation = {
  password: {
    de: 'Passwort',
    en: 'password'
  },
  email: {
    de: 'E-Mail',
    en: 'email'
  },
  key: {
    de: 'Schlüssel',
    en: 'Key'
  }
};

const translateMessages = (errObj) => {
  map(errObj, (value, _index) => {
    if (value.msg in messageTranslation)
      value.msgTranslation = messageTranslation[value.msg];
    if (value.param in fieldTranslation)
      value.paramTranslation = fieldTranslation[value.param];
  });
  return errObj;
};

export { translateMessages, messageTranslation };
