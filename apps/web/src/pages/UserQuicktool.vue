<template>
  <q-card>
    <div class="row q-pa-sm justify-center">
      <div class="col-12 col-sm-10 col-md-8">
        <div class="text-body2 q-pb-sm text-center">
          {{ t('quicktool.name') }}
        </div>
        <q-select
          v-model="taskSelect"
          :label="t('task')"
          name="taskSelect"
          :options="options"
          filled
        >
        </q-select>
        <form-main-task :task="taskForm"></form-main-task>
      </div>
    </div>
    {{ taskSelect }}
  </q-card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import FormMainTask from 'src/components/FormMainTask.vue';
import { PropType, ref, watch } from 'vue';
import { Task } from 'src/types';

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

const taskForm = ref(null) as any;
const taskSelect = ref({
  label: 'Checkup',
  value: 'checkup',
});

watch(taskSelect, (cur) => {
  taskForm.value = cur.value;
});

const options = [
  {
    label: 'Checkup',
    value: 'checkup',
  },
  {
    label: 'Treatment',
    value: 'treatment',
  },
  {
    label: 'Feed',
    value: 'feed',
  },
  {
    label: 'Harvest',
    value: 'harvest',
  },
];

const { t } = useI18n();
</script>
