<template>
  <q-card>
    <div class="row q-pa-sm justify-center">
      <div class="col-12 col-sm-10 col-md-8">
        <div class="text-body2 q-pb-sm text-center">
          {{ $t('quicktool.name') }}
        </div>
        <q-select
          v-model="taskSelect"
          :label="$t('quicktool.taskDropdown')"
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
import { find } from 'lodash-es';
import { PropType } from 'vue';
import { Task } from '~/types';
import { useQuicktoolStore } from '~/stores/quicktool';
import FormMainTask from '~/components/FormMainTask.vue';
import { useI18n } from 'vue-i18n';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const storeQuicktool = useQuicktoolStore();
const router = useRouter();
const props = defineProps({
  task: {
    type: String as PropType<Task>,
    required: true,
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
  // Helper for sidebar link to use latest quicktool setting and update url
  storeQuicktool.$state.link = cur?.value as Task;
  router.replace({
    name: 'new-quicktool',
    params: { task: cur?.value },
  });
});
</script>
