<template>
  <q-input
    v-model="state.password"
    :error="v.password.$error"
    :error-message="validationErrors(v.password)"
    :type="passwordField"
    :no-error-icon="true"
    :label="t(props.passwordLabel)"
    name="password"
    required
    filled
  >
    <template #prepend>
      <q-icon name="fas fa-lock" />
    </template>
    <template #append>
      <q-icon
        :name="passwordIcon"
        style="cursor: pointer"
        @click="changePasswordField"
      />
    </template>
  </q-input>
  <q-input
    v-if="confirm"
    v-model="state.confirmPassword"
    :error="v.confirmPassword.$error"
    :error-message="validationErrors(v.confirmPassword)"
    :type="passwordField"
    :no-error-icon="true"
    :label="t('confirmPassword')"
    name="confirmPassword"
    required
    filled
  >
    <template #prepend>
      <q-icon name="fas fa-lock" />
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue';
import { QInputProps } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useVModels } from '@vueuse/core';
import { validationErrors } from '~/helpers';
import useVuelidate from '@vuelidate/core';
import {
  sameAs,
  required,
  minLength,
  maxLength,
} from '../helpers/i18n-validators';

const { t } = useI18n();
const props = defineProps({
  confirm: {
    type: Boolean,
    default: false,
  },
  passwordLabel: {
    type: String,
    default: 'password',
  },
  modelPassword: {
    type: String,
    required: true,
  },
});
const emit = defineEmits(['update:modelPassword']);
const { modelPassword } = useVModels(props, emit);

const passwordField = ref('password' as QInputProps['type']);
const passwordIcon = ref('fas fa-eye');

const state = reactive({
  password: '',
  confirmPassword: '',
});
watch(state, (curr) => {
  if (curr.password != modelPassword.value) {
    modelPassword.value = curr.password;
  }
});

const rules = computed(() => {
  const localRules = {
    password: {
      required,
      minLengthValue: minLength(props.confirm ? 8 : 5),
      maxLengthValue: maxLength(100),
    },
    confirmPassword: {},
  };
  if (props.confirm) {
    localRules.confirmPassword = {
      required,
      sameAs: sameAs(modelPassword.value, t('password')),
    };
    localRules.password = {
      ...localRules.password,
      minLengthValue: minLength(8),
    };
  }
  return localRules;
});

const changePasswordField = () => {
  passwordField.value = passwordField.value === 'text' ? 'password' : 'text';
  passwordIcon.value =
    passwordField.value == 'text' ? 'fas fa-eye' : 'fas fa-eye-slash';
};
const v = useVuelidate(rules, state, { $autoDirty: true });
</script>
