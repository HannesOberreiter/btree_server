<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, toRef } from 'vue';
import { useApiFetch } from '../composables/useApi';
import { useDateFormat } from '../composables/useDate';
import { useNotification } from '../composables/useNotification';
import BtnBase from './BtnBase.vue';
import BtnBaseGroup from './BtnBaseGroup.vue';
import DialogForm from './DialogForm.vue';

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  opened: {
    default: false
  }
});
const emit = defineEmits(['refetch']);
const notification = useNotification();
const api = useApiFetch();
const useDate = useDateFormat();
const $q = useQuasar();
const data = toRef(props, 'data');
const isSubmitting = ref(false);

const queen = computed(() => {
  return data.value
    ? data.value.queen_location
      ? data.value.queen_location.queen
      : null
    : null;
});

function openForm(title: string, id: number | null, selected: number | null) {
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title,
      form: title,
      maximized: true,
      ids: id ? [id] : null,
      selected: selected ? [selected] : null
    }
  }).onOk(() => {
    emit('refetch');
  });
}

async function setModus(id: number, modus: boolean) {
  isSubmitting.value = true;
  const url = '/v1/queen';
  await api
    .patch(
      url,
      JSON.stringify({
        ids: [id],
        data: {
          modus: !modus,
          modus_date: useDate.isoFormat(useDate.getCurrent())
        }
      })
    )
    .then(
      async (_response: any) => {
        emit('refetch');
        notification.open('positive', '');
      },
      error => {
        notification.open('negative', error);
      }
    );
  isSubmitting.value = false;
}
</script>

<template>
  <div v-if="queen">
    <q-expansion-item
      switch-toggle-side
      expand-separator
      :default-opened="opened"
      icon="fas fa-venus"
      :header-class="queen.modus ? 'text-h6' : 'text-h6 text-negative'"
      :label="queen.modus ? queen.name : `${queen.name} (RIP)`"
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
              v-if="!queen.modus"
              color="negative"
              class="text-white"
              :label="`
                ${$t('inactive')}
                (${useDate.displayFormat(queen.modus_date, 'date')})
              `"
            />
          </div>
        </q-card-section>
        <q-card-section v-if="queen.note">
          <pre>{{ queen.note }}</pre>
        </q-card-section>
        <q-card-actions align="right">
          <BtnBaseGroup :spread="false">
            <BtnBase
              color="negative"
              :loading="isSubmitting"
              outline
              @click="setModus(queen.id, queen.modus)"
            >
              {{ queen.modus ? $t('inactivateQueen') : $t('activateQueen') }}
            </BtnBase>
            <BtnBase
              outline
              color="secondary"
              @click="openForm('queen', queen.id, null)"
            >
              {{ $t('editQueen') }}
            </BtnBase>
            <BtnBase
              outline
              color="primary"
              @click="openForm('queen', null, data.id)"
            >
              {{ $t('new') }} {{ $t('queen') }}
            </BtnBase>
          </BtnBaseGroup>
        </q-card-actions>
      </q-card>
    </q-expansion-item>
  </div>
</template>
