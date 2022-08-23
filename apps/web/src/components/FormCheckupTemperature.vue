<template>
  <form-input-numeric
    v-model="modelValue"
    :values="values"
    :reset="reset"
    label="temperature"
    icon="fas fa-temperature-high"
    :min-valid="-100"
    :max-valid="100"
    numeric-valid="decimal"
    :hint="
      isSuccess && hive.length > 0
        ? $t('temperatureHint', {
            height: temperature.metadata.height,
            lat: temperature.metadata.latitude,
            lon: temperature.metadata.longitude,
          })
        : ''
    "
  >
    <template v-if="!values || isEmpty(values)" #deepAfter>
      <q-spinner-hourglass v-if="isLoading" flat round></q-spinner-hourglass>
      <q-icon
        v-else
        name="fas fa-broadcast-tower"
        :style="
          hive.length === 0 || storeUser.getPaidStatus.status === false
            ? ''
            : 'cursor: pointer'
        "
        :disable="hive.length === 0 || storeUser.getPaidStatus.status === false"
        :color="
          hive.length === 0 || storeUser.getPaidStatus.status === false
            ? ''
            : 'orange'
        "
        @click="getTemperature(true)"
      >
        <tooltip-base>
          {{
            storeUser.getPaidStatus.status
              ? $t('temperatureTooltip')
              : $t('error.premium')
          }}
        </tooltip-base>
      </q-icon>
    </template>
  </form-input-numeric>
</template>

<script setup lang="ts">
import { useAuthUserStore } from '~/stores/auth';
import { useTemperatureQuery } from '~/composables/useQuery';
import { useVModels } from '@vueuse/core';
import { round, isEmpty } from 'lodash-es';

const storeUser = useAuthUserStore();
const loadTemp = ref(false);
const select = ref(0);

const props = defineProps({
  modelValue: {
    default: 0,
  },
  hive: {
    default: [] as any,
  },
  reset: {
    type: Number,
    default: 0,
  },
  values: {
    type: Object,
    default: null,
  },
});
const {
  isLoading,
  isSuccess,
  data: temperature,
  refetch,
} = useTemperatureQuery(select, {
  enabled: computed(
    () => select.value != 0 && loadTemp.value && props.values !== null
  ),
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

if (props.hive.length > 0 && storeUser.getPaidStatus.status === true)
  getTemperature();

watch(
  () => props.hive,
  () => {
    getTemperature();
  }
);

watch(temperature, (cur) => {
  if (!props.hive) return;
  if (props.hive.length === 0) return;
  if (cur) {
    modelValue.value = round(cur.data_current.temperature, 1);
    loadTemp.value = false;
  }
});

function getTemperature(click = false) {
  if (!storeUser.getPaidStatus.status) return;
  if (!props.hive) return;
  if (props.hive.length === 0) return;
  select.value =
    props.hive.length === 0 ? 0 : props.hive[0].hive_location.apiary_id;
  modelValue.value = temperature.value
    ? round(temperature.value.data_current.temperature, 1)
    : round(modelValue.value, 1);

  loadTemp.value = true;
  if (click)
    refetch.value().then(
      () => console.log('Loading new temperature from service'),
      (e) => console.error(e)
    );
}
</script>
