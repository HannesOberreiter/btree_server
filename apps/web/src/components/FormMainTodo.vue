<template>
  <q-form class="full-width" @submit.prevent.stop="onSubmit">
    <form-common-date v-model="state.date"></form-common-date>
    <form-common-name v-model="state.name"></form-common-name>
    <form-common-note v-model="state.note"></form-common-note>
    <div v-if="showInterval" class="row">
      <div class="col-6">
        <q-input
          v-model.number="stateRepeat.interval"
          type="number"
          :error="v.interval.$error"
          :error-message="validationErrors(v.interval)"
          :no-error-icon="true"
          :label="t('interval')"
          :hint="t('intervalText')"
          :shadow-text="t('day', 2)"
          filled
        >
          <template #append>
            <q-btn
              round
              flat
              dense
              icon="fas fa-plus"
              style="cursor: pointer"
              :disable="stateRepeat.interval >= 365"
              @click="stateRepeat.interval++"
            ></q-btn>
            <q-btn
              round
              flat
              dense
              icon="fas fa-minus"
              style="cursor: pointer"
              :disable="stateRepeat.interval <= 0"
              @click="stateRepeat.interval--"
            ></q-btn>
          </template>
        </q-input>
      </div>
      <div class="col-6 q-pl-sm">
        <q-input
          v-model.number="stateRepeat.repeat"
          type="number"
          :error="v.repeat.$error"
          :error-message="validationErrors(v.repeat)"
          :no-error-icon="true"
          :label="t('repeat')"
          :hint="t('repeatText')"
          shadow-text="x"
          filled
        >
          <template #append>
            <q-btn
              round
              flat
              dense
              icon="fas fa-plus"
              style="cursor: pointer"
              :disable="stateRepeat.repeat >= 50"
              @click="stateRepeat.repeat++"
            ></q-btn>
            <q-btn
              round
              flat
              dense
              icon="fas fa-minus"
              style="cursor: pointer"
              :disable="stateRepeat.repeat <= 0"
              @click="stateRepeat.repeat--"
            ></q-btn>
          </template>
        </q-input>
      </div>
    </div>
  </q-form>
  <q-btn-group spread class="full-width">
    <q-btn
      unelevated
      size="md"
      color="secondary"
      type="submit"
      :loading="isSubmitting"
      :label="t('save')"
      class="text-white"
      @click="onSubmit"
    />
    <q-btn
      unelevated
      size="md"
      color="info"
      :label="t('repeat')"
      class="text-white"
      @click="repeatTask"
    />
  </q-btn-group>
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
