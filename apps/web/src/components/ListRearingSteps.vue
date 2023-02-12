<template>
  <div class="col-12">
    <q-list v-if="steps" bordered separator>
      <q-item
        v-for="(step, index) in steps"
        :key="step.id"
        :class="step.active ? 'bg-info' : ''"
        class="q-pa-xs"
      >
        <q-item-section v-if="$q.screen.gt.xs" avatar>
          <btn-base-group>
            <btn-base
              flat
              :color="step.active ? 'primary' : 'grey'"
              icon="fas fa-arrow-up"
              :disable="index === 0 || !step.active"
              @click="onMove(index, index - 1)"
            />
            <btn-base
              flat
              :color="step.active ? 'secondary' : 'grey'"
              icon="fas fa-arrow-down"
              :disable="index === steps.length - 1 || !step.active"
              @click="onMove(index, index + 1)"
            />
          </btn-base-group>
        </q-item-section>
        <q-item-section
          style="cursor: pointer"
          @click="setActiveStep(step.id, step.active ? false : true)"
        >
          <q-item-label class="text-bold">
            {{ step.detail.job }} [
            <helper-day-and-hour :hour="step.detail.hour">
            </helper-day-and-hour>
            ]
          </q-item-label>
          {{ step.note }}
        </q-item-section>
        <q-item-section avatar>
          <btn-base-group v-if="!$q.screen.gt.xs">
            <btn-base
              flat
              :color="step.active ? 'primary' : 'grey'"
              icon="fas fa-arrow-up"
              :disable="index === 0 || !step.active"
              @click="onMove(index, index - 1)"
            />
            <btn-base
              flat
              :color="step.active ? 'secondary' : 'grey'"
              icon="fas fa-arrow-down"
              :disable="index === steps.length - 1 || !step.active"
              @click="onMove(index, index + 1)"
            />
          </btn-base-group>
          <btn-base-group>
            <btn-base
              flat
              :color="step.active ? 'secondary' : 'grey'"
              icon="fas fa-info"
              @click="showInfo(step.detail.note)"
            />
            <btn-base
              flat
              :color="step.active ? 'negative' : 'grey'"
              :disable="!step.active"
              icon="fas fa-xmark"
              @click="onDelete(step.id)"
            />
          </btn-base-group>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
  <div class="col-12 q-pt-md">
    <btn-base-group>
      <btn-base color="primary" @click="onSave">
        {{ $t('save') }}
      </btn-base>
      <btn-base color="secondary" @click="onAdd">
        {{ $t('add') }} {{ $t('step') }}
      </btn-base>
    </btn-base-group>
  </div>
</template>

<script setup lang="ts">
import filter from 'lodash-es/filter';
import map from 'lodash-es/map';
import { useQuasar } from 'quasar';
import { useApiFetch } from '~/composables/useApi';
import { useNotification } from '~/composables/useNotification';
import { usePreventNavigation } from '~/composables/usePreventNavgiation';
import { useI18n } from 'vue-i18n';
import { watch, ref, toRefs } from 'vue';

import DialogSelectOption from './DialogSelectOption.vue';
import helperDayAndHour from './HelperDayAndHour.vue';

const usePrevent = usePreventNavigation();
const api = useApiFetch();
const notification = useNotification();
const $q = useQuasar();
const { t } = useI18n();

const props = defineProps({
  methodSteps: {
    type: Array<any>,
    required: true,
  },
  methodId: {
    type: Number,
    required: true,
  },
});
const emit = defineEmits(['change']);
const { methodSteps, methodId } = toRefs(props);
const steps = ref(null);
watch(
  methodSteps,
  () => (steps.value = methodSteps.value ? methodSteps.value : null),
  { immediate: true }
);

function setActiveStep(id: number, set = true) {
  steps.value = steps.value.map(function (obj: any) {
    return { ...obj, active: obj.id === id ? set : false };
  });
  if (set === false) onSave();
}

function showInfo(info: string) {
  $q.dialog({ message: info, html: false });
}

function onMove(oldIndex: number, newIndex: number) {
  const f = steps.value.splice(oldIndex, 1)[0];
  // insert stored item into position `to`
  steps.value.splice(newIndex, 0, f);
  usePrevent.unsavedPosition(steps.value);
}

function onAdd() {
  $q.dialog({
    component: DialogSelectOption,
    componentProps: {
      label: 'step',
      text: 'dialogSelectOptionAdd',
      table: 'rearing_detail',
    },
  }).onOk((obj) => {
    api
      .post('/v1/rearing_step', {
        type_id: methodId.value,
        detail_id: obj.id,
        position: steps.value.length + 1,
      })
      .then(
        () => {
          notification.open('positive', '');
          emit('change');
        },
        () => notification.open('negative', 'error')
      );
  });
}

function resetActiveStep() {
  steps.value.map((obj: any) => {
    obj.active = false;
    return obj;
  });
  usePrevent.state.value = false;
}

function onSave() {
  if (!usePrevent.state.value) {
    resetActiveStep();
  } else {
    const patch = map(steps.value, (obj, index) => {
      return { id: obj.id, position: index + 1 };
    });
    api.patch('/v1/rearing_step/updatePosition', { data: patch }).then(
      () => {
        notification.open('positive', 'updated');
        resetActiveStep();
        emit('change');
      },
      () => notification.open('negative', 'error')
    );
  }
}

function onDelete(id: number) {
  $q.dialog({
    title: t('delete'),
    message: t('deleteConfirm'),
    cancel: true,
  }).onOk(() => {
    api.remove(`/v1/rearing_step/${id}`).then(
      () => {
        notification.open('positive', 'deleted');
        steps.value = filter(steps.value, (o) => o.id != id);
      },
      () => notification.open('negative', 'error.unknown')
    );
  });
}
</script>
