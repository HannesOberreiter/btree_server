<template>
  <div class="col-12">
    <q-list v-if="modelValue" bordered separator>
      <q-item
        v-for="(step, index) in modelValue.step"
        :key="step.id"
        :class="step.active ? 'bg-info' : ''"
      >
        <q-item-section avatar>
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
              :disable="index === modelValue.length - 1 || !step.active"
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
        {{ $t('save') }} {{ $t('step', 2) }}
      </btn-base>
      <btn-base color="secondary" @click="onAdd">
        {{ $t('add') }} {{ $t('step') }}
      </btn-base>
    </btn-base-group>
  </div>
  <div class="col-12 q-pt-md">
    <btn-base-group>
      <btn-base color="info" @click="onCreate(null)">
        {{ $t('new') }} {{ $t('step') }}
      </btn-base>
      <btn-base color="blue" @click="onEdit">
        {{ $t('edit') }} {{ $t('step') }}
      </btn-base>
      <btn-base color="negative" @click="onDeleteStep">
        {{ $t('delete') }} {{ $t('step') }}
      </btn-base>
    </btn-base-group>
  </div>
</template>

<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import filter from 'lodash-es/filter';
import map from 'lodash-es/map';
import { useQuasar } from 'quasar';
import { useApiFetch } from '~/composables/useApi';
import { useNotification } from '~/composables/useNotification';
import DialogSelectOption from './DialogSelectOption.vue';
import DialogForm from './DialogForm.vue';

const api = useApiFetch();
const notification = useNotification();
const $q = useQuasar();
const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(['update:modelValue', 'change']);
const { modelValue } = useVModels(props, emit);

function setActiveStep(id: number, set = true) {
  modelValue.value.step = map(modelValue.value.step, (obj) => {
    obj.active = obj.id === id ? set : false;
    return obj;
  });
}

function showInfo(info: string) {
  $q.dialog({ message: info, html: false });
}

function onMove(oldIndex: number, newIndex: number) {
  const f = modelValue.value.step.splice(oldIndex, 1)[0];
  // insert stored item into position `to`
  modelValue.value.step.splice(newIndex, 0, f);
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
        type_id: modelValue.value.id,
        detail_id: obj.id,
        position: modelValue.value.step.length + 1,
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

function onCreate(editIds: Array<number> = []) {
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title: 'new',
      form: 'rearing_detail',
      maximized: false,
      ids: editIds,
    },
  }).onOk(() => (editIds.length === 0 ? onAdd() : emit('change')));
}

function onEdit() {
  $q.dialog({
    component: DialogSelectOption,
    componentProps: {
      label: 'step',
      table: 'rearing_detail',
    },
  }).onOk((obj) => {
    onCreate([obj.id]);
  });
}

function onSave() {
  const patch = map(modelValue.value.step, (obj, index) => {
    return { id: obj.id, position: index };
  });
  api.patch('/v1/rearing_step/updatePosition', { data: patch }).then(
    () => notification.open('positive', 'updated'),
    () => notification.open('negative', 'error')
  );
}

function onDelete(id: number) {
  $q.dialog({
    title: t('delete'),
    message: t('deleteConfirm'),
    cancel: true,
  }).onOk(() => {
    api.deleting(`/v1/rearing_step/${id}`).then(
      () => {
        notification.open('positive', 'deleted');
        modelValue.value.step = filter(
          modelValue.value.step,
          (o) => o.id != id
        );
      },
      () => notification.open('negative', 'error.unknown')
    );
  });
}

function onDeleteStep() {
  $q.dialog({
    component: DialogSelectOption,
    componentProps: {
      label: 'step',
      table: 'rearing_detail',
    },
  }).onOk((selected) => {
    $q.dialog({
      title: t('delete'),
      message: t('deleteConfirm'),
      cancel: true,
    }).onOk(() => {
      api.patch('/v1/rearing_detail/batchDelete', { ids: [selected.id] }).then(
        () => {
          notification.open('positive', 'deleted');
          emit('change');
        },
        () => notification.open('negative', 'error.unknown')
      );
    });
  });
}
</script>
