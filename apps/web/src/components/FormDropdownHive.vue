<template>
  <q-select
    ref="apiarySelect"
    v-model="apiary"
    :label="$t('quicktool.apiary')"
    name="apiary"
    :loading="isLoadingApiary || isLoadingHive"
    :disable="isLoadingApiary || isLoadingHive"
    :options="optionsApiary"
    :clearable="true"
    multiple
    options-dense
    :use-input="!$q.platform.is.mobile"
    @filter="filterApiary"
    @clear="clearApiary"
    @update:model-value="selectApiary"
  >
    <template #before>
      <q-icon name="fas fa-location-dot"></q-icon>
    </template>
  </q-select>
  <q-select
    v-model="state.hive"
    :error="v.hive.$error"
    :error-message="validationErrors(v.hive)"
    :no-error-icon="true"
    :label="$t('hive')"
    :loading="isLoadingApiary && isLoadingHive"
    :disable="isLoadingApiary && isLoadingHive"
    :options="optionsHive"
    :option-label="
      (val) => {
        if (!val.modus) {
          return val.label + ' ' + $t('inactive');
        } else {
          return val.label;
        }
      }
    "
    clearable
    counter
    multiple
    :use-chips="!$q.platform.is.mobile"
    :use-input="!$q.platform.is.mobile"
    filled
    class="hive-select"
    data-cy="select-hive"
    @update:model-value="selectHive"
    @filter="filterHive"
  >
    <template #before>
      <q-icon name="fas fa-house"></q-icon>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { filter, map, union, unionBy } from 'lodash-es';
import { required } from '~/helpers/i18n-validators';
import { useApiariesQuery, useHivesQuery } from '~/composables/useQuery';
import { useVModels } from '@vueuse/core';
import { validationErrors } from '~/helpers';
import useVuelidate from '@vuelidate/core';
import { useScanningStore } from '~/stores/scanning';
import { useNotification } from '~/composables/useNotification';

const storeScanning = useScanningStore();
const { hiveDropdownActive, scannedId } = storeToRefs(storeScanning);

const router = useRouter();
const { t } = useI18n();
const { isLoading: isLoadingHive, data: hives } = useHivesQuery({});
const { isLoading: isLoadingApiary, data: apiaries } = useApiariesQuery({});
const notification = useNotification();

onMounted(() => {
  hiveDropdownActive.value = true;
  scannedId.value = null;
});
onUnmounted(() => {
  hiveDropdownActive.value = false;
  scannedId.value = null;
});

const props = defineProps({
  modelValue: {
    default: [],
  },
  selected: {
    type: Array,
    default: null,
  },
  required: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

const apiary = ref(null);
const apiarySelect = ref(null);
const optionsHive = ref([] as any);
const optionsApiary = ref([] as any);

const clearApiary = () => {
  apiary.value = null;
  state.hive = null;
};

function selectApiary(val: any) {
  apiarySelect.value.hidePopup();
  apiarySelect.value.blur();
  map(val, (v) => {
    const res = filter(
      hives.value.results,
      (obj) => obj.hive_location.apiary_name === v.name
    );
    if (!state.hive) state.hive = [];
    if (res.length > 0) state.hive = unionBy(state.hive, res, 'id') as [];
  });
}

function selectHive() {
  apiary.value = null;
}

function filterHive(val: any, update: any, _abort: any) {
  if (hives.value !== null) {
    update(() => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      const needle = new RegExp(`(${val.toLowerCase()})`);
      optionsHive.value = filter(hives.value.results, (obj) =>
        needle.test(obj.label.toLowerCase())
      );
    });
  }
  if (val === '') {
    update(() => {
      optionsHive.value = hives.value.results;
    });
    return;
  }
}

function setSelected() {
  if (props.selected && hives.value)
    state.hive = filter(hives.value.results, (obj) =>
      props.selected.includes(obj.id)
    );
}

function filterApiary(val: any, update: any, _abort: any) {
  const data = filter(apiaries.value.results, (obj) => obj.hive_count !== null);

  if (apiaries.value.results.length > 0 && val) {
    update(() => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      const needle = new RegExp(`(${val.toLowerCase()})`);
      optionsApiary.value = filter(data, (obj) =>
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
const rules = computed(() => {
  if (props.required) {
    return {
      hive: { required: required(t('hive')) },
    };
  } else {
    return { hive: {} };
  }
});
const v = useVuelidate(rules, state);

onMounted(() => {
  if (router.currentRoute.value.name === 'detail-apiary') {
    watch(
      [apiaries, router.currentRoute],
      () => {
        if (router.currentRoute.value.params?.id) {
          const { double, found } = findApiaries(
            apiaries.value.results,
            String(router.currentRoute.value.params.id),
            apiary.value
          );
          if (found && double.length === 0) {
            apiary.value = union(apiary.value, found);
            selectApiary(apiary.value);
          }
        }
      },
      { immediate: true }
    );
  }

  if (router.currentRoute.value.name === 'detail-hive') {
    watch(
      [hives, router.currentRoute],
      () => {
        if (router.currentRoute.value.params?.id) {
          const { double, found } = findHives(
            hives.value.results,
            String(router.currentRoute.value.params.id),
            state.hive
          );
          if (found && double.length === 0) {
            state.hive = union(state.hive, found);
          }
        }
      },
      { immediate: true }
    );
  }
});

watch(state, (cur) => {
  if (cur.hive === null) cur.hive = [];
  emit('update:modelValue', cur.hive);
});

watch(
  hives,
  () => {
    setSelected();
  },
  { immediate: true }
);

watch(scannedId, () => {
  if (scannedId.value && hives.value) {
    const { double, found } = findHives(
      hives.value.results,
      scannedId.value,
      state.hive
    );
    if (found && double.length === 0) {
      notification.open(
        'positive',
        t('addedHive', { name: found['name'] }),
        true
      );
      scannedId.value = null;
      state.hive = union(state.hive, found);
    }
    if (double.length > 0) {
      notification.open('info', t('error.alreadyScanned'), true);
    }
  }
});

function findHives(hives: any, id: string, selected_hives: any) {
  const found = filter(hives, (obj) => id === String(obj.id)) as any;
  const double = filter(selected_hives, (obj) => id == obj.id);
  return { found: found, double: double };
}

function findApiaries(apiaries: any, id: string, selected_apiaries: any) {
  const found = filter(apiaries, (obj) => id === String(obj.id)) as any;
  const double = filter(selected_apiaries, (obj) => id == obj.id);
  return { found: found, double: double };
}
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
