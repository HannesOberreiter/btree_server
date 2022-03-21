<template>
  <q-input
    v-model="v.company.$model"
    :error="v.company.$error"
    :error-message="validationErrors(v.company)"
    :no-error-icon="true"
    :label="t('company.name')"
    name="company"
    required
    filled
  >
    <template #prepend>
      <q-icon name="fas fa-warehouse" />
    </template>
  </q-input>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import {
  alphaNum,
  minLength,
  required,
  maxLength,
} from '~/helpers/i18n-validators';
import { reactive } from 'vue';
import { validationErrors } from '~/helpers';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const state = reactive({
  company: '',
});
const rules = {
  company: {
    required,
    alphaNum,
    minLengthValue: minLength(5),
    maxLengthValue: maxLength(45),
  },
};

const v = useVuelidate(rules, state);
</script>
