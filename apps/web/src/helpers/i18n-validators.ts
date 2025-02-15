import { i18n } from '../boot/i18n';
import {
  createI18nMessage,
  minLength as vMinLength,
  maxLength as vMaxLength,
  email as vEmail,
  sameAs as vSameAs,
  alphaNum as vAlphaNum,
  numeric as vNumeric,
  integer as vInteger,
  decimal as vDecimal,
  minValue as vMinValue,
  maxValue as vMaxValue,
  between as vBetween,
} from '@vuelidate/validators';

// Create your i18n message instance. Used for vue-i18n@9
const withI18nMessage = createI18nMessage({ t: i18n.global.t.bind(i18n) });

import { helpers } from '@vuelidate/validators';

// Using custom "required" validator, to add params
const requiredCustom = (field: string) =>
  helpers.withParams({ field: field }, (value) => helpers.req(value));

export const requiredField = withI18nMessage(requiredCustom, {
  withArguments: true,
});

export const minLength = withI18nMessage(vMinLength, {
  withArguments: true,
});
export const maxLength = withI18nMessage(vMaxLength, {
  withArguments: true,
});
export const email = withI18nMessage(vEmail);

export const sameAs = withI18nMessage(vSameAs, {
  withArguments: true,
});

export const alphaNum = withI18nMessage(vAlphaNum);
export const numeric = withI18nMessage(vNumeric);
export const integer = withI18nMessage(vInteger);
export const decimal = withI18nMessage(vDecimal);

export const minValue = withI18nMessage(vMinValue, {
  withArguments: true,
});
export const maxValue = withI18nMessage(vMaxValue, {
  withArguments: true,
});

export const between = withI18nMessage(vBetween, {
  withArguments: true,
});
