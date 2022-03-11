<template>
  <q-input
    v-model="state.name"
    :error="v.name.$error"
    :error-message="validationErrors(v.name)"
    :no-error-icon="true"
    :label="t('name')"
    name="name"
    type="text"
    filled
  >
  </q-input>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { required, maxLength } from '../helpers/i18n-validators';
import { reactive } from 'vue';
import { validationErrors } from '../helpers';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const state = reactive({
  name: '',
});
const rules = {
  name: { required, maxLengthValue: maxLength(48) },
};
const v = useVuelidate(rules, state, { $autoDirty: true });
</script>
