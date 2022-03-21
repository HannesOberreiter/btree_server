<template>
  <q-card>
    <div class="row q-pa-sm justify-center">
      <div class="col-12 col-sm-10 col-md-8">
        <div class="text-body2 q-pb-sm text-center">
          {{ t('quicktool.name') }}
        </div>
        <q-select
          v-model="taskSelect"
          :label="t('quicktool.taskDropdown')"
          name="taskSelect"
          standout
          :options="options"
          rounded
          class="q-mb-sm text-center"
        >
        </q-select>
        <form-main-task
          v-if="taskSelect"
          :task="(taskForm as any)"
        ></form-main-task>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { find } from 'lodash';
import { PropType, ref, watch } from 'vue';
import { Task } from '~/types';
import { useI18n } from 'vue-i18n';
import FormMainTask from '~/components/FormMainTask.vue';

const { t } = useI18n();
const props = defineProps({
  task: {
    type: String as PropType<Task>,
    required: true,
  },
  id: {
    type: String,
    default: '',
  },
});
const options = [
  {
    label: t('checkup'),
    value: 'checkup',
  },
  {
    label: t('treatment'),
    value: 'treatment',
  },
  {
    label: t('feed'),
    value: 'feed',
  },
  {
    label: t('harvest'),
    value: 'harvest',
  },
];

const taskSelect = ref(find(options, { value: props.task }));
const taskForm = ref(taskSelect.value ? taskSelect.value.value : '');

watch(taskSelect, (cur) => {
  if (cur) taskForm.value = cur.value;
});
</script>
