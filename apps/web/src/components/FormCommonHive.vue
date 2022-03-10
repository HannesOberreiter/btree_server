<template>
  <q-select
    v-model="v.hive.$model"
    @filter="filterFn"
    :label="t('hive')"
    name="hive"
    :loading="loading"
    :disable="loading"
    :options="hives"
    clearable
    counter
    multiple
    options-dense
    use-chips
    use-input
  >
  </q-select>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { required } from '../helpers/i18n-validators';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import { useNotification } from 'src/composables/useResponseText';

const { t } = useI18n();
const loading = ref(true);
const notification = useNotification();
const hives = reactive(async () => {
  return await loadHives();
});
const options = ref(hives);

async function loadHives() {
  let result: { label: string; value: number }[] = [];
  await api.get('/v1/hive').then(
    (response: any) => {
      loading.value = false;
      console.log(response.data);
      result = [{ label: 'test', value: 1 }];
    },
    (error) => {
      notification.open('negative', error);
      result = [];
    }
  );
  return result;
}

const model = ref(null);

function filterFn(val: any, update: any, _abort: any) {
  if (options.value !== null) {
    update(() => {
      const needle = val.toLowerCase();
      options.value = hives.value.filter(
        (v: any) => v.label.toLowerCase().indexOf(needle) > -1
      );
    });
  }
}

const state = reactive({
  hive: [],
});
const rules = {
  hive: { required },
};
const v = useVuelidate(rules, state);
</script>
