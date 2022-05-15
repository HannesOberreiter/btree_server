<template>
  <div v-if="queen">
    <q-expansion-item
      switch-toggle-side
      expand-separator
      :default-opened="opened"
      icon="fas fa-venus"
      header-class="text-h6"
      :label="queen.name"
    >
      <q-card>
        <q-card-section>
          <div class="col-12 q-gutter-xs">
            <q-chip
              v-if="queen.mating"
              square
              color="orange"
              text-color="black"
              :label="queen.mating.name"
            />
            <q-chip
              v-if="queen.race"
              square
              color="orange"
              text-color="black"
              :label="queen.race.name"
            />
            <q-chip
              color="info"
              text-color="black"
              square
              :label="`
                ${$t('birth')}:
                ${useDate.displayFormat(queen.date, 'date')}
                [${queen.mark_colour}]
              `"
            />
            <q-chip
              square
              color="info"
              text-color="black"
              :label="`
                ${$t('queenMovedate')}:
                ${useDate.displayFormat(queen.move_date, 'date')}
              `"
            />
            <q-chip
              v-if="!data.modus"
              color="negative"
              :label="`
                ${$t('inactive')}
                (${useDate.displayFormat(data.modus_date, 'date')})
              `"
            />
          </div>
        </q-card-section>
        <q-card-section v-if="queen.note">
          <pre>{{ queen.note }}</pre>
        </q-card-section>
        <q-card-actions align="right">
          <btn-base-group :spread="false">
            <btn-base
              outline
              color="secondary"
              @click="openForm('queen', queen.id, null)"
            >
              {{ $t('edit') }} {{ $t('queen') }}
            </btn-base>
            <btn-base
              outline
              color="primary"
              @click="openForm('queen', null, data.id)"
            >
              {{ $t('new') }} {{ $t('queen') }}
            </btn-base>
          </btn-base-group>
        </q-card-actions>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useDateFormat } from '~/composables/useDate';
import DialogForm from './DialogForm.vue';

const useDate = useDateFormat();
const $q = useQuasar();
const emit = defineEmits(['refetch']);
const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  opened: {
    default: false,
  },
});
const data = toRef(props, 'data');

const queen = computed(() => {
  return data.value
    ? data.value.queen_location
      ? data.value.queen_location.queen
      : null
    : null;
});

function openForm(title: string, id: number, selected: number) {
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title: title,
      form: title,
      maximized: true,
      ids: id ? [id] : null,
      selected: selected ? [selected] : null,
    },
  }).onOk(() => {
    emit('refetch');
  });
}
</script>
