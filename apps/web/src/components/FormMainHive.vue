<template>
  <q-form class="full-width" @submit.prevent.stop="onSubmit">
    <form-common-name v-model="state.name"></form-common-name>
    <form-common-dropdown-type
      table="hive_types"
      label="status"
    ></form-common-dropdown-type>
    <form-common-dropdown-source
      table="hive_sources"
      label="source"
    ></form-common-dropdown-source>

    Wanderung
    <form-common-dropdown-apiary></form-common-dropdown-apiary>

    <form-common-date v-model="state.date"></form-common-date>
    <form-common-note v-model="state.note"></form-common-note>
    <form-common-done
      label="modus"
      status-active="active"
      status-inactive="inactive"
    ></form-common-done>
  </q-form>
</template>

<script setup lang="ts">
import { api } from '~/boot/axios';
import { PropType, reactive, ref, watch } from 'vue';
import { Todo } from '~/types';
import { useI18n } from 'vue-i18n';
import { useNotification } from '~/composables/useResponseText';
import dayjs from 'dayjs';
import FormCommonDate from './FormCommonDate.vue';
import FormCommonName from './FormCommonName.vue';
import FormCommonNote from './FormCommonNote.vue';
import FormCommonDone from './FormCommonDone.vue';

import FormCommonDropdownType from './FormCommonDropdownOption.vue';
import FormCommonDropdownSource from './FormCommonDropdownOption.vue';
import FormCommonDropdownApiary from './FormCommonDropdownApiary.vue';

import useVuelidate from '@vuelidate/core';
import { integer, maxValue, minValue } from '~/helpers/i18n-validators';
import { validationErrors } from '~/helpers';

const { t } = useI18n();
const notification = useNotification();
const showInterval = ref(false);

const stateRepeat = reactive({
  interval: 0,
  repeat: 0,
});

const rules = {
  interval: {
    minValue: minValue(0),
    maxValue: maxValue(365),
    integer: integer,
  },
  repeat: {
    minValue: minValue(0),
    maxValue: maxValue(50),
    integer: integer,
  },
};

const v = useVuelidate(rules, stateRepeat, { $autoDirty: true });

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
  const data = JSON.stringify({ ...state.value, ...stateRepeat });
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

function repeatTask() {
  showInterval.value = !showInterval.value;
  if (!showInterval.value) {
    stateRepeat.interval = 0;
    stateRepeat.repeat = 0;
  }
}
</script>
