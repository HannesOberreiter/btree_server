<template>
  <q-card>
    <div class="row q-pa-sm justify-center">
      <div class="col-12 col-sm-10 col-md-8">
        <div class="text-h5 q-pb-sm text-center">
          {{ $t('edit') }} {{ $t(task) }}
        </div>
        <form-main-task
          v-if="taskSelect"
          :task="(taskForm as any)"
          :ids="ids"
        ></form-main-task>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { find } from 'lodash-es';
import { PropType } from 'vue';
import { Task } from '~/types';
import FormMainTask from '~/components/FormMainTask.vue';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';

const { t } = useI18n();
const props = defineProps({
  task: {
    type: String as PropType<Task>,
    required: true,
  },
  ids: {
    default: null,
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
</script>
