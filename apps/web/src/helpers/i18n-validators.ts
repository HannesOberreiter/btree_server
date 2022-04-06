import * as validators from '@vuelidate/validators';
import { i18n } from '~/boot/i18n';

// or import { createI18nMessage } from '@vuelidate/validators'
const { createI18nMessage } = validators;

// Create your i18n message instance. Used for vue-i18n@9
const withI18nMessage = createI18nMessage({ t: i18n.global.t.bind(i18n) });

import { helpers } from '@vuelidate/validators';

// Using custom "required" validator, to add params
const requiredCustom = (field: string) =>
  helpers.withParams({ field: field }, (value) => helpers.req(value));

export const required = withI18nMessage(requiredCustom, {
  withArguments: true,
});

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
export const integer = withI18nMessage(validators.integer);
export const decimal = withI18nMessage(validators.decimal);

export const minValue = withI18nMessage(validators.minValue, {
  withArguments: true,
});
export const maxValue = withI18nMessage(validators.maxValue, {
  withArguments: true,
});

export const between = withI18nMessage(validators.between, {
  withArguments: true,
});
