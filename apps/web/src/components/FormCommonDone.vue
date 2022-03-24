<template>
  <div class="row">
    <div class="col-8 col-md-5 col-lg-3">
      <q-item v-ripple tag="label">
        <q-item-section>
          <q-item-label>
            <btn-multiple-values
              v-if="modelMultiple"
              @click="modelMultiple = modelMultiple"
            ></btn-multiple-values>
            {{ t(label) }}:</q-item-label
          >
        </q-item-section>
        <q-item-section>
          <q-toggle
            v-model="modelValue"
            color="blue"
            val="true"
            size="lg"
            :disable="modelMultiple"
            :label="modelValue === false ? t(statusInactive) : t(statusActive)"
          ></q-toggle>
        </q-item-section>
      </q-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import BtnMultipleValues from './BtnMultipleValues.vue';

const { t } = useI18n();
const props = defineProps({
  modelValue: {
    default: false,
  },
  modelMultiple: {
    default: false,
  },
  label: {
    default: 'status',
  },
  statusActive: {
    default: 'open',
  },
  statusInactive: {
    default: 'done',
  },
});
const emit = defineEmits(['update:modelValue', 'update:modelMultiple']);
const { modelValue, modelMultiple } = useVModels(props, emit);
</script>
