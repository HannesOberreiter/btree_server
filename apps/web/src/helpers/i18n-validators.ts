import * as validators from '@vuelidate/validators';
import { i18n } from '../boot/i18n';

// or import { createI18nMessage } from '@vuelidate/validators'
const { createI18nMessage } = validators;

// extract the `t` helper, should work for both Vue 2 and Vue 3 versions of vue-i18n
// eslint-disable-next-line @typescript-eslint/unbound-method
const { t } = i18n.global || i18n;

// pass `t` and create your i18n message instance
const withI18nMessage = createI18nMessage({ t });

// wrap each validator.
export const required = withI18nMessage(validators.required);
// validators that expect a parameter should have `{ withArguments: true }` passed as a second parameter, to annotate they should be wrapped
export const minLength = withI18nMessage(validators.minLength, {
  withArguments: true,
});
export const maxLength = withI18nMessage(validators.maxLength, {
  withArguments: true,
});
export const email = withI18nMessage(validators.email);

export const sameAs = withI18nMessage(validators.sameAs, {
  withArguments: true,
});

export const alphaNum = withI18nMessage(validators.alphaNum);
export const numeric = withI18nMessage(validators.numeric);

export const between = withI18nMessage(validators.between, {
  withArguments: true,
});
