<template>
  <q-expansion-item
    switch-toggle-side
    :default-opened="opened"
    header-class="text-h5"
  >
    <template #header>
      <q-item-section> {{ data.name }} </q-item-section>
      <q-item-section v-if="data.hive_location" side>
        <btn-base
          flat
          icon="fas fa-map-marker-alt"
          @click.stop="onApiary(data.hive_location.apiary_id)"
        >
          <span v-if="$q.platform.is.mobile">
            {{ truncate(data.hive_location.apiary_name, { length: 5 }) }}
          </span>
          <span v-else>
            {{ truncate(data.hive_location.apiary_name, { length: 20 }) }}
          </span>
        </btn-base>
      </q-item-section>
    </template>
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
import { truncate } from 'lodash-es';

const $q = useQuasar();
const useDate = useDateFormat();
const router = useRouter();
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

function onApiary(id: number) {
  router.push({ name: 'detail-apiary', params: { id: id } });
}
</script>
