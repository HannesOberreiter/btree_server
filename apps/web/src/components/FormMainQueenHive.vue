<template>
  <q-form class="full-width" data-cy="form-queen-hive" @submit.prevent.stop="">
    <div class="row">
      <form-dropdown-edit
        v-show="isEdit"
        v-model="editOptions"
        :disable="true"
        class="col-12"
        :options="editOptionsCopy"
      ></form-dropdown-edit>

      <div class="col-12 q-pb-sm">
        <form-dropdown-option
          v-if="isEdit"
          v-model="state.hive"
          label="hive"
          table="hive"
          table-id="hive_id"
          :values="values"
          :reset="reset"
          filter-empty="noHive"
          :hint="$t('queenHiveInfo')"
        ></form-dropdown-option>
        <form-dropdown-hive
          v-else
          v-model="state.hive"
          :required="false"
        ></form-dropdown-hive>
      </div>
      <div class="col-12 col-md-6 q-pt-sm q-mb-sm">
        <form-input-date
          v-model="state.move_date"
          :values="values"
          :reset="reset"
          label="queenMovedate"
          :hint="$t('queenMovedateInfo')"
        ></form-input-date>
      </div>
    </div>
  </q-form>

  <form-buttons
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    form="queen"
    @reset="onReset"
    @change="onChange"
  ></form-buttons>
</template>

<script lang="ts">
import { flatten, map, merge } from 'lodash-es';
import dayjs from 'dayjs';

const stateDefault = {
  move_date: dayjs().format('YYYY-MM-DD'),
};
</script>

<script setup lang="ts">
import { useNotification } from '~/composables/useNotification';
import useVuelidate from '@vuelidate/core';
import { FormQueenHive } from '~/types';
import { useApiFetch } from '~/composables/useApi';
import FormButtons from './FormButtons.vue';
import { ref, computed, unref } from 'vue';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormDropdownHive from './FormDropdownHive.vue';
import FormInputDate from './FormInputDate.vue';
import FormDropdownOption from './FormDropdownOption.vue';

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

const state = ref<FormQueenHive>({
  hive: undefined as any,
  ...stateDefault,
});
const rules = {};
const v = useVuelidate(rules, state, { $autoDirty: true });

async function getEdit(id: unknown[]) {
  console.log(id);
  return await api.post('/v1/queen/batchGet', { ids: id }).then(
    (response: any) => {
      const editIds = map(response, (row: any) => [
        { value: row.id, label: `ID: ${row.id} / (${row.name})` },
      ]);
      editOptions.value = flatten(editIds);
      editOptionsCopy.value = [...unref(editOptions.value)];
      values.value = response;
    },
    (error) => {
      notification.open('negative', error);
    },
  );
}

function onReset() {
  if (!isEdit.value) {
    merge(state.value, stateDefault);
  }
  reset.value++;
  notification.open('info', 'successReset');
}

async function onChange() {
  emit('onSuccess', true);
}
</script>
