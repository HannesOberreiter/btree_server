<template>
  <q-input
    v-model="displayValue"
    input-class="text-center"
    type="text"
    readonly
    filled
    @click="qDateProxy = !qDateProxy"
  >
    <template #before>
      <q-icon :name="icon" class="cursor-pointer">
        <q-popup-proxy
          v-model="qDateProxy"
          cover
          transition-show="scale"
          transition-hide="scale"
        >
          <q-date
            v-model="modelValue"
            :events="markDate"
            today-btn
            range
            @update:model-value="() => (qDateProxy = !qDateProxy)"
          >
            <div class="row items-center justify-end">
              <btn-date-auto-close
                @change="(v: boolean) => autoClose = v"
              ></btn-date-auto-close>
              <btn-base
                v-close-popup
                :label="$t('close')"
                color="primary"
                flat
              />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import dayjs from 'dayjs';
import { useDateFormat } from '~/composables/useDate';

const { t } = useI18n();
const qDateProxy = ref(false);
const autoClose = ref(false);

const useDate = useDateFormat();
const displayValue = ref('');
const props = defineProps({
  modelValue: {
    default: null,
  },
  mark: {
    default: dayjs().format('YYYY-MM-DD'),
  },
  label: {
    type: String,
    default: 'date',
  },
  icon: {
    type: String,
    default: 'fas fa-calendar',
  },
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

watch(
  modelValue,
  (cur) => {
    if (cur) {
      displayValue.value = `${t('from')} ${useDate.displayFormat(
        cur.from
      )} to ${useDate.displayFormat(cur.to)}`;
    } else {
      displayValue.value = t('filterNoDate');
    }
  },
  { immediate: true }
);

function markDate(date: string) {
  return dayjs(date).isSame(props.mark);
}
</script>
