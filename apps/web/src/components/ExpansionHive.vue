<template>
  <q-expansion-item
    switch-toggle-side
    :default-opened="opened"
    icon="fas fa-house"
    header-class="text-h5"
    :label="`
      ${data.name} (${data.hive_location ? data.hive_location.apiary_name : ''})
    `"
  >
    <q-card>
      <q-card-section>
        <div class="col-12 q-gutter-xs">
          <q-chip
            v-if="data.hive_source"
            color="orange"
            square
            text-color="black"
            :label="data.hive_source.name"
          />
          <q-chip
            v-if="data.hive_type"
            square
            color="orange"
            text-color="black"
            :label="data.hive_type.name"
          />
          <q-chip
            v-if="data.grouphive && data.grouphive > 1"
            color="info"
            square
            text-color="black"
            :label="`
              ${$t('hive', 2)}:
              ${data.grouphive}
            `"
          />
          <q-chip
            v-if="data.position && data.position > 0"
            square
            color="info"
            text-color="black"
            :label="`
              ${$t('position')}:
              ${data.position}
            `"
          />
          <q-chip
            v-if="data.firstMovedate"
            square
            color="info"
            text-color="black"
            :label="`
              ${$t('created')}:
              ${useDate.isoFormat(data.firstMovedate.date)}
            `"
            ><q-tooltip>{{ $t('hintHiveFirstMovedate') }}</q-tooltip>
          </q-chip>
          <q-chip
            v-if="!data.modus"
            square
            color="negative"
            :label="`${$t('inactive')} (${useDate.displayFormat(
              data.modus_date,
              'date'
            )})`"
          />
        </div>
      </q-card-section>
      <q-card-section v-if="data.note">
        <pre>{{ data.note }}</pre>
      </q-card-section>
      <q-card-actions class="float-right">
        <btn-base color="primary" outline @click="openForm('hive', data.id)">
          {{ $t('edit') }} {{ $t('hive') }}
        </btn-base>
      </q-card-actions>
    </q-card>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useDateFormat } from '~/composables/useDate';
import DialogForm from './DialogForm.vue';

const $q = useQuasar();
const useDate = useDateFormat();
const emit = defineEmits(['refetch']);
defineProps({
  data: {
    type: Object,
    required: true,
  },
  opened: {
    default: false,
  },
});

function openForm(title: string, id: number) {
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title: title,
      form: title,
      maximized: true,
      ids: [id],
    },
  }).onOk(() => {
    emit('refetch');
  });
}
</script>
