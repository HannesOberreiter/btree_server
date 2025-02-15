<template>
  <q-dialog
    ref="dialogRef"
    :maximized="$q.platform.is.mobile"
    @hide="onDialogHide"
  >
    <q-card style="width: 700px">
      <q-card-section>
        <div class="row">
          <div class="text-h6">{{ $t(label) }}</div>
          <q-space />
          <btn-close-dialog></btn-close-dialog>
        </div>
        <div class="row full-width text-center">
          <div class="col-12">
            {{ $t(text) }}
          </div>
          <div class="col-12">
            <form-dropdown-option
              v-model="value"
              :label="label"
              :table="table"
              :allow-empty="allowEmpty"
            >
            </form-dropdown-option>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="center">
        <btn-base
          size="md"
          :label="$t('ok')"
          color="primary"
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import type { PropType } from 'vue';
import type { Option } from '../types';
import BtnCloseDialog from './BtnCloseDialog.vue';
import BtnBase from './BtnBase.vue';
import FormDropdownOption from './FormDropdownOption.vue';
import { ref, unref } from 'vue';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const value = ref('');

defineProps({
  label: {
    default: 'type',
  },
  text: {
    default: 'dialogSelectOptionSelect',
  },
  table: {
    type: String as PropType<Option>,
    required: true,
  },
  allowEmpty: {
    type: String,
    default: '',
  },
});

function onConfirm() {
  onDialogOK(unref(value.value));
}

defineEmits([...useDialogPluginComponent.emits]);
</script>
