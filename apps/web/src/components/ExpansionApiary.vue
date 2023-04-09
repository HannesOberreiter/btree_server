<template>
  <q-expansion-item
    switch-toggle-side
    :default-opened="opened"
    icon="fas fa-house"
    header-class="text-h5"
  >
    <template #header>
      {{ data.name }}&nbsp;
      <span v-if="data.hive_count">
        [{{ data.hive_count.count }}]&nbsp;
        <span v-if="data.hive_count.grouphivescount > 0">
          + {{ data.hive_count.grouphivescount }}
        </span>
      </span>
      <span v-else>[0]</span>
    </template>
    <q-card>
      <q-card-section class="q-pb-xs">
        <div class="col-12 q-gutter-xs">
          <btn-base
            v-if="data?.url?.trim()"
            size="md"
            round
            color="orange"
            text-color="black"
            icon="fas fa-image"
            @click="showFile(data.url)"
          />
          <q-chip
            v-if="data?.description?.trim()"
            square
            color="info"
            text-color="black"
            :label="data.description"
          />
          <q-chip
            v-if="data.latitude || data.longitude"
            square
            color="info"
            text-color="black"
            :label="`
            ${$t('latitude')}: ${data.latitude} /
            ${$t('longitude')}: ${data.longitude}
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
            ><tooltip-base>{{ $t('hintApiaryFirstMovedate') }}</tooltip-base>
          </q-chip>
          <q-chip
            v-if="!data.modus"
            square
            color="negative"
            class="text-white"
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
      <q-card-actions align="right">
        <btn-base color="primary" outline @click="openForm('apiary', data.id)">
          {{ $t('edit') }} {{ $t('apiary') }}
        </btn-base>
      </q-card-actions>
    </q-card>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useDateFormat } from '~/composables/useDate';
import DialogForm from './DialogForm.vue';
import DialogFileShow from './DialogFileShow.vue';

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

function showFile(value: string) {
  if (value && value !== '') {
    $q.dialog({
      component: DialogFileShow,
      componentProps: {
        value: value,
      },
    });
  }
}
</script>
