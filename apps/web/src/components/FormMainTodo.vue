<template>
  <q-form @submit.prevent.stop="onSubmit" class="full-width">
    <form-common-date v-model="state.date"></form-common-date>
    <form-common-name v-model="state.name"></form-common-name>
    <form-common-note v-model="state.note"></form-common-note>
  </q-form>
  <q-btn
    unelevated
    @click="onSubmit"
    size="lg"
    color="secondary"
    type="submit"
    :loading="isSubmitting"
    :label="t('save')"
    class="full-width text-white"
  />
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { useNotification } from '../composables/useResponseText';
import { api } from 'boot/axios';
import dayjs from 'dayjs';
import { PropType, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Todo } from '../types';

import FormCommonDate from './FormCommonDate.vue';
import FormCommonName from './FormCommonName.vue';
import FormCommonNote from './FormCommonNote.vue';

const { t } = useI18n();
const notification = useNotification();
const v = useVuelidate();

const props = defineProps({
  formData: {
    type: Object as PropType<Todo>,
    default: () => {
      return {
        date: dayjs().format('YYYY-MM-DD'),
        name: '',
        note: '',
      };
    },
  },
});
const emit = defineEmits<{
  (e: 'onSuccess', value: boolean): void;
}>();

watch(props, (cur) => {
  state.value = cur.formData;
});
const state = ref({
  ...props.formData,
});

const isSubmitting = ref(false);

async function onSubmit() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  const data = JSON.stringify(state.value);
  await api.post('/v1/todo', data).then(
    (_response: any) => {
      notification.open('positive', '');
      emit('onSuccess', true);
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
}
</script>
