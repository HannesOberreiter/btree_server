<template>
  <q-dialog
    ref="dialogRef"
    :maximized="$q.platform.is.mobile"
    @hide="onDialogHide"
  >
    <q-card>
      <q-card-section class="">
        <div class="row">
          <div class="text-h6">{{ $t('calculateVarroa') }}</div>
          <q-space />
          <btn-close-dialog></btn-close-dialog>
        </div>
        <div class="row full-width">
          <div class="col-12">
            <FormInputNumeric
              v-model.number="sum"
              type="number"
              :min-valid="0"
              icon="fas fa-stopwatch-20"
              label="count"
              class="q-pb-xs"
            ></FormInputNumeric>
            <FormInputNumeric
              v-model.number="days"
              type="number"
              :min-valid="1"
              :max-valid="365"
              icon="fas fa-calendar-day"
              label="day"
              :label-plural="days"
              class="q-pb-xs"
            >
            </FormInputNumeric>
            <btn-base
              v-if="lastCheckup"
              flat
              size="md"
              class="text-weight-thin"
              @click="
                days === lastCheckup.days
                  ? (days = 1)
                  : (days = lastCheckup.days)
              "
            >
              {{ lastCheckup.text }}
            </btn-base>
            <q-input
              v-model.number="solution"
              type="number"
              :label="$t('solution')"
              readonly
            ></q-input>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="center">
        <btn-base color="secondary" @click="onDialogOK(solution)">
          {{ $t('copy') }}
        </btn-base>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { round } from 'lodash-es';
import { useDialogPluginComponent } from 'quasar';
import { computed, ref, toRef } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import BtnCloseDialog from './BtnCloseDialog.vue';
import FormInputNumeric from './FormInputNumeric.vue';
import { useTasksQuery } from '../composables/useQuery';
import { useI18n } from 'vue-i18n';
import BtnBase from './BtnBase.vue';

const props = defineProps({
  value: {
    type: Number,
    default: 0,
  },
  hive: {
    type: Array,
    default: [] as any,
  },
});
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const { t } = useI18n();
const hive = toRef(props, 'hive');
const sum = ref(props.value);
const days = useLocalStorage('varroa-days', 1);

const filters = computed(() => {
  if (!hive.value) return undefined;
  if (hive.value.length === 0) return undefined;
  return JSON.stringify([{ hive_id: (hive.value[0] as any).id }]);
});
const enabled = computed(() => {
  return filters.value ? true : false;
});
const solution = computed(() => {
  const d = Number.isNaN(days.value) || days.value <= 0 ? 1 : days.value;
  return round(sum.value / d, 1);
});
const lastCheckup = computed(() => {
  if (!data.value) return undefined;
  if (data.value?.results?.length === 0) return undefined;
  const result = data.value?.results[0];
  const now = new Date();
  const date = new Date(result.date);
  const diff = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
  if (diffDays > 365) return undefined;
  return {
    days: diffDays,
    text: `${t('lastCheckup')}: ${diffDays} ${t('day', diffDays)} (${
      result.hive?.name
    }, ${result.type?.name})`,
  };
});

const { data } = useTasksQuery('checkup', {
  offset: 0,
  limit: 1,
  order: ['date'],
  direction: ['desc'],
  filters,
  done: null,
  enabled,
});

defineEmits([...useDialogPluginComponent.emits, 'onSuccess']);
</script>
