<script setup lang="ts">
import type { PropType } from 'vue';
import type { TodoResponse } from '../api/types';
import type { FormTodo } from '../types';
import useVuelidate from '@vuelidate/core';
import dayjs from 'dayjs';
import { flatten, map, merge } from 'lodash-es';
import { computed, ref, unref } from 'vue';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import BtnBase from './BtnBase.vue';
import FormButtons from './FormButtons.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormDropdownOption from './FormDropdownOption.vue';
import FormInputCheckbox from './FormInputCheckbox.vue';
import FormInputDate from './FormInputDate.vue';
import FormInputNote from './FormInputNote.vue';
import FormInputNumeric from './FormInputNumeric.vue';
import FormInputText from './FormInputText.vue';
import FormInputUrl from './FormInputUrl.vue';

const props = defineProps({
  ids: {
    type: Array as PropType<number[] | null>,
    default: null
  },
  date: {
    type: String,
    default: dayjs().format('YYYY-MM-DD')
  }
});
const emit = defineEmits<{
  (e: 'success', value: boolean): void;
}>();
const notification = useNotification();
const showInterval = ref(false);
const values = ref({});
const api = useApiFetch();
const reset = ref(0);
const ids = ref(props.ids);
const isEdit = computed(() => {
  if (ids.value === null) {
    return false;
  }
  if (ids.value.length === 0) {
    return false;
  }
  return true;
});
if (isEdit.value) {
  getEdit(unref(ids.value));
}

const v = useVuelidate();

const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;

const stateDefault = {
  date: props.date,
  name: '',
  url: '',
  note: '',
  done: false,
  interval: 0,
  repeat: 0,
  apiary: null
};

const state = ref<FormTodo>({
  ...stateDefault
});

async function getEdit(id: number[] | null) {
  if (!id) {
    return;
  }
  return await (
    api.post('/v1/todo/batchGet', { ids: id }) as Promise<TodoResponse[]>
  ).then(
    response => {
      const editIds = map(response, (row: TodoResponse) => [
        { value: row.id, label: `ID: ${row.id} / (${row.name})` }
      ]);
      editOptions.value = flatten(editIds);
      editOptionsCopy.value = flatten(editIds);
      values.value = response;
    },
    error => {
      notification.open('negative', error);
    }
  );
}

function onReset() {
  if (!isEdit.value) {
    merge(state.value, stateDefault);
  }
  if (showInterval.value) {
    repeatTask();
  }
  notification.open('positive', 'successReset');
  reset.value++;
}

function repeatTask() {
  showInterval.value = !showInterval.value;
  if (!showInterval.value) {
    state.value.interval = 0;
    state.value.repeat = 0;
  }
}
</script>

<template>
  <q-form class="full-width" data-cy="form-todo" @submit.prevent.stop="">
    <FormDropdownEdit
      v-if="isEdit"
      v-model="editOptions"
      :options="editOptionsCopy"
      off-label="name"
    />
    <div class="row">
      <div class="col-11">
        <FormInputDate
          v-model="state.date"
          :values="values"
          :reset="reset"
          :required="isEdit ? false : true"
        />
      </div>
      <div v-if="!isEdit" class="col-1 text-center items-center">
        <BtnBase
          flat
          round
          icon="fas fa-retweet"
          :color="showInterval ? 'secondary' : 'grey'"
          @click="repeatTask"
        />
      </div>
    </div>
    <div v-if="showInterval" class="row">
      <div class="col-12 col-md-6">
        <FormInputNumeric
          v-model.number="state.interval"
          label="interval"
          :hint="$t('intervalText')"
          :shadow-text="$t('day', 2)"
          :max-valid="365"
          icon="fas fa-arrow-down-1-9"
          numeric-valid="integer"
        />
      </div>
      <div class="col-12 col-md-6">
        <FormInputNumeric
          v-model.number="state.repeat"
          label="repeat"
          :hint="$t('repeatText')"
          shadow-text="x"
          icon="fas fa-infinity"
          numeric-valid="integer"
        />
      </div>
    </div>
    <FormInputText
      v-model="state.name"
      label="name"
      name="todo"
      icon="fas fa-passport"
      :values="values"
      :reset="reset"
      :required="isEdit ? false : true"
    />
    <FormInputUrl v-model="state.url" :values="values" :reset="reset" />
    <FormDropdownOption
      v-model="state.apiary"
      label="apiary"
      table="apiary"
      table-id="apiary_id"
      :values="values"
      :reset="reset"
      allow-empty="placeholder"
    />
    <FormInputNote v-model="state.note" :values="values" :reset="reset" />
    <FormInputCheckbox v-model="state.done" :values="values" :reset="reset" />
  </q-form>
  <FormButtons
    class="q-pt-md"
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    form="todo"
    @reset="onReset"
    @change="emit('success', true)"
  />
</template>
