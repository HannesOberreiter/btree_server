<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <q-card-section class="">
        <div class="row">
          <div class="text-h6">{{ t('calculateVarroa') }}</div>
          <q-space />
          <q-btn
            ref="closeBtn"
            icon="fas fa-times"
            flat
            round
            dense
            v-close-popup
          />
        </div>
        <div class="row full-width">
          <div class="col-12">
            <q-input v-model="sum" type="number" :label="t('count')"></q-input>
            <q-input
              v-model="days"
              type="number"
              :rules="[(val) => val > 0]"
              no-error-icon
              :label="t('day', 2)"
            ></q-input>
            <q-input
              v-model="solution"
              type="number"
              :label="t('solution')"
              readonly
            ></q-input>
          </div>
        </div>
      </q-card-section>
      <q-card-actions>
        <q-btn color="secondary" @click="onDialogOK(solution)">
          {{ t('copy') }}
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const { t } = useI18n();

const props = defineProps({
  value: {
    type: Number,
    default: 0,
  },
});

const sum = ref(props.value);
const days = ref(1);
const solution = ref(sum.value / days.value);

watch(sum, () => {
  if (days.value <= 0) days.value = 1;
  solution.value =
    Math.round((sum.value / days.value + Number.EPSILON) * 10) / 10;
});
watch(days, () => {
  if (days.value <= 0) days.value = 1;
  solution.value =
    Math.round((sum.value / days.value + Number.EPSILON) * 10) / 10;
});

defineEmits([...useDialogPluginComponent.emits, 'onSuccess']);
</script>
