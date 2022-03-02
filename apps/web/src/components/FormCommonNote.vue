<template>
  <q-input
    v-model="v.note.$model"
    :error="v.note.$error"
    :error-message="validationErrors(v.note)"
    :no-error-icon="true"
    :label="t('note')"
    name="note"
    type="textarea"
    filled
  >
  </q-input>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { maxLength } from '../helpers/i18n-validators';
import { reactive } from 'vue';
import { validationErrors } from '../helpers';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const state = reactive({
  note: '',
});
const rules = {
  note: { maxLengthValue: maxLength(2000) },
};
const v = useVuelidate(rules, state);
</script>
