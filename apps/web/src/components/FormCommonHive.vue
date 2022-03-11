<template>
  <q-select
    v-model="apiary"
    @filter="filterApiary"
    @update:model-value="selectApiary"
    :label="t('quicktool.apiary')"
    name="apiary"
    :loading="isLoadingApiary || isLoadingHive"
    :disable="isLoadingApiary || isLoadingHive"
    :options="optionsApiary"
    clearable
    counter
    multiple
    options-dense
    use-input
  >
  </q-select>
  <q-select
    v-model="v.hive.$model"
    @update:model-value="selectHive"
    @filter="filterHive"
    :label="t('hive')"
    :loading="isLoadingApiary && isLoadingHive"
    :disable="isLoadingApiary && isLoadingHive"
    :options="optionsHive"
    clearable
    counter
    multiple
    use-chips
    use-input
    filled
    behavior="dialog"
    class="hive-select"
  >
  </q-select>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { required } from '../helpers/i18n-validators';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApiariesQuery, useHivesQuery } from 'src/query';
import _ from 'lodash';

const { t } = useI18n();
const { isLoading: isLoadingHive, data: hives } = useHivesQuery();
const { isLoading: isLoadingApiary, data: apiaries } = useApiariesQuery();

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
    if (res.length > 0) state.hive = _.unionBy(state.hive, res, 'hive_id');
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
  const data = _.filter(apiaries.value, (obj) => obj.hive_count !== null);

  if (apiaries.value !== null) {
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
  hive: [] as any,
});
const rules = {
  hive: { required },
};
const v = useVuelidate(rules, state);
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
