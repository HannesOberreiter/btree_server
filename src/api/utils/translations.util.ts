import { map } from 'lodash';

const messageTranslation = {
  requiredField: {
    de: 'Fehlendes verpflichtendes Feld.',
    en: 'Missing required field.',
    fr: 'Champ obligatoire manquant.',
    it: 'Campo obbligatorio mancante.',
  },
  wrongLogin: {
    de: 'Falsches Passwort oder E-Mail.',
    en: 'Wrong passwort or email.',
    fr: 'Mauvais mot de passe ou email.',
    it: 'Passwort o e-mail errata.',
  },
  'Invalid value': {
    de: 'Falscher Wert',
    en: 'Invalid value',
    fr: 'Valeur non valide',
    it: 'Valore non valido',
  },
};

const fieldTranslation = {
  password: {
    de: 'Passwort',
    en: 'password',
    fr: 'mot de passe',
    it: 'password',
  },
  email: {
    de: 'E-Mail',
    en: 'email',
    fr: 'e-mail',
    it: 'e-mail',
  },
  key: {
    de: 'Schlüssel',
    en: 'Key',
    fr: 'Clé',
    it: 'Chiave',
  },
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
