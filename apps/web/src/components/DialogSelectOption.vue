<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="width: 700px">
      <q-card-section>
        <div class="row">
          <div class="text-h6">{{ $t(label) }}</div>
          <q-space />
          <q-btn
            ref="closeBtn"
            v-close-popup
            icon="fas fa-times"
            flat
            round
            dense
          />
        </div>
        <div class="row full-width text-center">
          <div class="col-12">
            {{ $t('dialogSelectOptionText') }}
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
        <q-btn
          unelevated
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
import { PropType } from 'vue';
import { Option } from '~/types';
import FormDropdownOption from './FormDropdownOption.vue';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const value = ref('');

defineProps({
  label: {
    default: 'type',
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
