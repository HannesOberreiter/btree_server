<template>
  <q-input
    v-model="v.email.$model"
    :error="v.email.$error"
    :error-message="validationErrors(v.email)"
    :no-error-icon="true"
    :label="t('email')"
    name="email"
    type="email"
    required
    filled
    :readonly="fieldStatus"
  >
    <template v-slot:prepend>
      <q-icon name="fas fa-at" />
    </template>
    <template v-slot:append>
      <q-btn
        v-if="fieldStatus"
        icon="fas fa-edit"
        @click="fieldStatus = !fieldStatus"
      />
    </template>
  </q-input>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { email, required, maxLength } from '../helpers/i18n-validators';
import { reactive, ref, watch } from 'vue';
import { validationErrors } from '../helpers';
import { useI18n } from 'vue-i18n';
import { useVModels } from '@vueuse/core';
const { t } = useI18n();

const props = defineProps({
  modelMail: {
    type: String,
    default: '',
  },
  disableMail: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelMail']);
const { modelMail } = useVModels(props, emit);

const fieldStatus = ref(props.disableMail);

const state = reactive({
  email: modelMail.value,
});
watch(state, (curr) => {
  emit('update:modelMail', curr.email);
});

const rules = {
  email: { required, email, maxLengthValue: maxLength(50) },
};
const v = useVuelidate(rules, state);
</script>
