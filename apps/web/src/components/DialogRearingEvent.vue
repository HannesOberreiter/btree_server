<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { computed } from 'vue';
import { useRearingEventQuery } from '../composables/useQuery';
import BtnBase from './BtnBase.vue';
import BtnCloseDialog from './BtnCloseDialog.vue';
import EventInfoRearing from './EventInfoRearing.vue';
import GlobalLoading from './GlobalLoading.vue';

const props = defineProps({
  id: {
    type: Number,
    required: true
  }
});
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const { isLoading, data } = useRearingEventQuery({ id: props.id });
const event = computed(() => data.value?.[0]);
</script>

<template>
  <q-dialog
    ref="dialogRef"
    :maximized="$q.platform.is.mobile"
    @hide="onDialogHide"
  >
    <q-card style="min-width: 50%">
      <q-card-section>
        <BtnCloseDialog class="float-right" />
        <div class="row">
          <span v-if="!isLoading && event">
            <q-icon :name="`fas fa-${event.symbol}`" />
            ID: {{ event.name ? event.name : event.id }}
          </span>
          <q-space />
        </div>
        <div class="row full-width">
          <div v-if="isLoading" class="col-12">
            <GlobalLoading />
          </div>
          <div v-else-if="event" class="col-12">
            <EventInfoRearing :event-info="event" />
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <BtnBase outline color="grey" @click="onDialogOK()">
          {{ $t('close') }}
        </BtnBase>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
