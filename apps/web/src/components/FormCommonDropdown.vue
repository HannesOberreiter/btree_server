<template>
  <q-select
    v-model="option"
    :label="t(label)"
    name="option"
    :loading="isLoading"
    :disable="isLoading"
    :options="options"
    option-label="name"
    options-value="id"
    filled
  >
  </q-select>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { required } from '../helpers/i18n-validators';
import { PropType, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useOptionsQuery } from 'src/query';
import _ from 'lodash';
import { Option } from 'src/types';

const { t } = useI18n();
const props = defineProps({
  label: {
    default: 'type',
  },
  table: {
    type: String as PropType<Option>,
    required: true,
  },
});

const { isLoading, data } = useOptionsQuery(props.table);

const option = ref(null);

const options = ref([] as any);

if (data.value) {
  setOptions();
} else {
  watch(data, () => {
    setOptions();
  });
}

function setOptions() {
  const temp = _.filter(data.value, (obj) => obj.modus);
  options.value = temp;
}
</script>
