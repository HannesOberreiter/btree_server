<template>
  <q-dialog ref="dialogRef" :maximized="true" @hide="onDialogHide">
    <q-card>
      <q-card-section>
        <div class="row">
          <span v-if="!isLoading">ID: {{ data[0].id }}</span>
          <q-space />
          <btn-base
            ref="closeBtn"
            v-close-popup
            icon="fas fa-times"
            flat
            round
            dense
          />
        </div>
        <div class="row full-width">
          <div v-if="isLoading" class="col-12">
            <global-loading></global-loading>
          </div>
          <div v-else class="col-12">
            <event-info-rearing :event-info="data[0]"></event-info-rearing>
          </div>
        </div>
      </q-card-section>
      <q-card-actions>
        <btn-base outline color="grey" @click="onDialogOK()">
          {{ $t('close') }}
        </btn-base>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useRearingEventQuery } from '~/composables/useQuery';

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
});

const { isLoading, data } = useRearingEventQuery({ id: props.id });
</script>
