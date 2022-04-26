<template>
  <q-form class="full-width" @submit.prevent.stop="">
    <form-dropdown-edit
      v-if="isEdit"
      v-model="editOptions"
      off-label="date"
      class="col-12"
      :options="editOptionsCopy"
    ></form-dropdown-edit>
    <form-input-date
      v-model="state.date"
      date-format="YYYY-MM-DD HH:mm"
      label="date"
      :values="values"
      :reset="reset"
    ></form-input-date>
    <form-dropdown-rearing
      v-model="state.type"
      v-model:model-detail="state.detail"
      v-model:model-date="state.date"
      :values="values"
      :reset="reset"
    ></form-dropdown-rearing>
    <div class="col-12 col-md-6 q-pt-sm q-pb-sm">
      <form-input-numeric
        v-model="state.larvae"
        label="larvae"
        icon="fas fa-egg"
        numeric-valid="integer"
        :values="values"
        :reset="reset"
      >
      </form-input-numeric>
    </div>
    <div class="col-12 col-md-6 q-pt-sm q-pb-sm">
      <form-input-numeric
        v-model="state.hatch"
        label="hatch"
        icon="fas fa-cake-candles"
        numeric-valid="integer"
        :values="values"
        :reset="reset"
      >
      </form-input-numeric>
    </div>

    <form-input-note
      v-model="state.note"
      class="q-pt-sm"
      :values="values"
      :reset="reset"
    ></form-input-note>
  </q-form>

  <form-buttons
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    form="rearing"
    @reset="onReset"
    @change="emit('onSuccess', true)"
  ></form-buttons>
</template>

<script lang="ts">
import { flatten, map, merge } from 'lodash-es';
import dayjs from 'dayjs';

const stateDefault = {
  date: dayjs().format('YYYY-MM-DD HH:mm'),
  larvae: 0,
  hatch: 0,
  note: '',
};
</script>

<script setup lang="ts">
import { useNotification } from '~/composables/useNotification';
import useVuelidate from '@vuelidate/core';
import { FormRearing } from '~/types';
import { useApiFetch } from '~/composables/useApi';

const notification = useNotification();
const api = useApiFetch();
const values = ref({});
const reset = ref(0);
const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;
const emit = defineEmits(['onSuccess']);
const props = defineProps({
  ids: {
    type: Array,
    default: null,
  },
});

const ids = ref(props.ids);
const isEdit = computed(() => {
  if (ids.value === null) return false;
  if (ids.value.length === 0) return false;
  return true;
});
if (isEdit.value) getEdit(unref(ids.value));

const state = ref<FormRearing>({
  detail: undefined as any,
  type: undefined as any,
  ...stateDefault,
});

const rules = {};
const v = useVuelidate(rules, state, { $autoDirty: true });

async function getEdit(id: unknown[]) {
  return await api.post('/v1/rearing/batchGet', { ids: id }).then(
    (response: any) => {
      const editIds = map(response, (row: any) => [
        {
          value: row.id,
          label: `ID: ${row.id} / (${dayjs(row.date).format(
            'YYYY-MM-DD HH:mm'
          )})`,
        },
      ]);
      editOptions.value = flatten(editIds);
      editOptionsCopy.value = [...unref(editOptions.value)];
      values.value = response;
    },
    (error) => {
      notification.open('negative', error);
    }
  );
}

function onReset() {
  if (!isEdit.value) {
    merge(state.value, stateDefault);
  }
  reset.value++;
  notification.open('info', 'successReset');
}
</script>
