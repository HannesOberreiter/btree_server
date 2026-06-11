<script setup lang="ts">
import type { PropType } from 'vue';
import { useVModels } from '@vueuse/core';
import dayjs from 'dayjs';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BtnBase from '../components/BtnBase.vue';
import BtnDateAutoClose from '../components/BtnDateAutoClose.vue';
import { useDateFormat } from '../composables/useDate';

const props = defineProps({
  modelValue: {
    type: Object as PropType<any | null>,
    default: null
  },
  mark: {
    default: dayjs().format('YYYY-MM-DD')
  },
  label: {
    type: String,
    default: 'date'
  },
  icon: {
    type: String,
    default: 'fas fa-calendar'
  }
});
const emit = defineEmits(['update:modelValue']);
const { t } = useI18n();
const qDateProxy = ref(false);
const autoClose = ref(false);

const useDate = useDateFormat();
const displayValue = ref('');
const { modelValue } = useVModels(props, emit);

watch(
  modelValue,
  cur => {
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
              <BtnDateAutoClose @change="(v: boolean) => (autoClose = v)" />
              <BtnBase
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
