<template>
  <q-select
    v-model="apiary"
    :label="t('quicktool.apiary')"
    name="apiary"
    :loading="isLoadingApiary || isLoadingHive"
    :disable="isLoadingApiary || isLoadingHive"
    :options="optionsApiary"
    clearable
    multiple
    options-dense
    use-input
    @filter="filterApiary"
    @update:model-value="selectApiary"
  >
  </q-select>
  <q-select
    v-model="state.hive"
    :error="v.hive.$error"
    :error-message="validationErrors(v.hive)"
    :no-error-icon="true"
    :label="t('hive')"
    :loading="isLoadingApiary && isLoadingHive"
    :disable="isLoadingApiary && isLoadingHive"
    :options="optionsHive"
    :option-label="
      (val) => {
        const modus = val.hive_modus ? '' : t('inactive');
        return val.label + ' ' + modus;
      }
    "
    clearable
    counter
    multiple
    use-chips
    use-input
    filled
    class="hive-select"
    @update:model-value="selectHive"
    @filter="filterHive"
  >
  </q-select>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { reactive, ref, watch } from 'vue';
import { required } from '~/helpers/i18n-validators';
import { useApiariesQuery, useHivesQuery } from '~/query';
import { useI18n } from 'vue-i18n';
import { useVModels } from '@vueuse/core';
import { validationErrors } from '~/helpers';
import useVuelidate from '@vuelidate/core';

const { t } = useI18n();
const { isLoading: isLoadingHive, data: hives } = useHivesQuery();
const { isLoading: isLoadingApiary, data: apiaries } = useApiariesQuery();

const props = defineProps({
  modelValue: {
    default: [],
  },
});

const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

const apiary = ref(null);
const optionsHive = ref([] as any);
const optionsApiary = ref([] as any);

function selectApiary(val: any) {
  const data = _.filter(
    hives.value,
    (obj) => obj.hive_modus && !obj.hive_deleted
  );
  _.map(val, (v) => {
    const res = _.filter(data, (obj) => obj.apiary_name === v.name);
    if (!state.hive) state.hive = [];
    if (res.length > 0)
      state.hive = _.unionBy(state.hive, res, 'hive_id') as [];
  });
}

function selectHive() {
  apiary.value = null;
}

function filterHive(val: any, update: any, _abort: any) {
  const data = _.filter(
    hives.value,
    (obj) => obj.hive_modus && !obj.hive_deleted
  );
  if (hives.value !== null) {
    update(() => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      const needle = new RegExp(`(${val.toLowerCase()})`);
      optionsHive.value = _.filter(data, (obj) =>
        needle.test(obj.label.toLowerCase())
      );
    });
  }
  if (val === '') {
    update(() => {
      optionsHive.value = data;
    });
    return;
  }
}

function filterApiary(val: any, update: any, _abort: any) {
  const data = _.filter(
    apiaries.value.result,
    (obj) => obj.hive_count !== null
  );

  if (apiaries.value.result.length > 0 && val) {
    update(() => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      const needle = new RegExp(`(${val.toLowerCase()})`);
      optionsApiary.value = _.filter(data, (obj) =>
        needle.test(obj.label.toLowerCase())
      );
    });
  }
  if (val === '') {
    update(() => {
      optionsApiary.value = data;
    });
    return;
  }
}

const state = reactive({
  hive: modelValue.value,
});
const rules = {
  hive: { required },
};
const v = useVuelidate(rules, state);

watch(state, (cur) => {
  if (cur.hive === null) cur.hive = [];
  emit('update:modelValue', cur.hive);
});
</script>

<style>
.hive-select .q-field__native {
  max-height: 120px;
  overflow-y: auto;
}
.q-dialog--modal .q-field__native {
  max-height: 120px;
  overflow-y: auto;
}
</style>
