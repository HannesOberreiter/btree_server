<template>
  <div class="row q-pb-sm">
    <q-expansion-item
      v-model="expanded"
      icon="fas fa-window-maximize"
      class="full-width"
      :label="$t('frames.text')"
      :class="some(modelValue, (val) => val > 0) ? 'bg-orange' : ''"
    >
      <q-card>
        <q-card-section>
          <template v-for="(_value, index) of modelValue" :key="index">
            <div class="row q-pb-xs">
              <div class="col-3">{{ $t('frames.' + index) }}</div>
              <div class="col-9">
                <q-slider
                  v-model="modelValue[index]"
                  :error="v[index].$error"
                  :step="1"
                  :min="0"
                  :max="max"
                  :disable="disable[index]"
                  size="sm"
                >
                </q-slider>
                {{ modelValue[index] }}
                <btn-multiple-values
                  v-if="multipleValues[index]"
                  :disable="disable[index]"
                  @click="editValues(!disable[index], index)"
                ></btn-multiple-values>
              </div>
            </div>
          </template>
          <div class="row q-pb-xs">
            <div class="col-12">
              <q-btn class="float-right" no-caps @click="max = max + 10">
                {{ $t('frames.extend') }} ({{ $t('max') }}: {{ max }})
              </q-btn>
              <q-btn class="float-right" no-caps @click="max = 20">
                {{ $t('reset') }}
              </q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
import { integer, maxValue, minValue } from '~/helpers/i18n-validators';
import { isEmpty, some } from 'lodash';
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';
import BtnMultipleValues from './BtnMultipleValues.vue';
import { formCheckMultipleValues } from '~/helpers';

const expanded = ref(false);
const max = ref(20);
const props = defineProps({
  modelValue: {
    default: {
      broodframes: 0,
      honeyframes: 0,
      foundation: 0,
      emptyframes: 0,
    },
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
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);
const resetValue = { ...unref(modelValue.value) };
const { values, reset } = toRefs(props);
const multipleValues = computed(() => {
  return {
    broodframes: formCheckMultipleValues(values.value, 'broodframes'),
    honeyframes: formCheckMultipleValues(values.value, 'honeyframes'),
    foundation: formCheckMultipleValues(values.value, 'foundation'),
    emptyframes: formCheckMultipleValues(values.value, 'emptyframes'),
  };
});
const disable = ref(multipleValues.value);

const rules = {
  broodframes: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    integer: integer,
  },
  honeyframes: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    integer: integer,
  },
  foundation: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    integer: integer,
  },
  emptyframes: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    integer: integer,
  },
};

const v = useVuelidate(rules, modelValue, { $autoDirty: true });

watch(values, () => {
  setValues();
});

watch(reset, () => {
  setValues();
});

function setValues() {
  disable.value = multipleValues.value;
  for (const [key, value] of Object.entries(multipleValues.value)) {
    if (value) editValues(true, key);
    else if (values.value && !isEmpty(values.value))
      modelValue.value[key as keyof typeof modelValue.value] =
        values.value[0][key];
    else
      modelValue.value[key as keyof typeof modelValue.value] =
        resetValue[key as keyof typeof resetValue];
  }
}

function editValues(val: boolean, key: string) {
  disable.value[key as keyof typeof disable.value] = val;
  modelValue.value[key as keyof typeof modelValue.value] = disable.value[
    key as keyof typeof disable.value
  ]
    ? null
    : modelValue.value[key as keyof typeof modelValue.value];
}
</script>
