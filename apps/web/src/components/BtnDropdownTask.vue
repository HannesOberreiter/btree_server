<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import BtnBase from './BtnBase.vue';
import BtnBaseGroup from './BtnBaseGroup.vue';
import DialogForm from './DialogForm.vue';
import TooltipBase from './TooltipBase.vue';

const emit = defineEmits(['refetch']);
const { t } = useI18n();
const $q = useQuasar();

const TASKS = [
  { label: t('checkup'), name: 'checkup', icon: 'fas fa-search-plus' },
  { label: t('feed'), name: 'feed', icon: 'fas fa-cube' },
  { label: t('harvest'), name: 'harvest', icon: 'fas fa-droplet' },
  { label: t('treatment'), name: 'treatment', icon: 'fas fa-kit-medical' },
  { label: t('movement'), name: 'movedate', icon: 'fas fa-truck' }
];
const currentTask = ref(TASKS[0]!);

function openModal(task: { label: string; name: string; icon: string }) {
  currentTask.value = task;
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title: task.name,
      form: task.name,
      maximized: true,
      ids: []
    }
  }).onOk(() => emit('refetch'));
}
</script>

<template>
  <BtnBaseGroup v-if="$q.screen.gt.md">
    <BtnBase
      v-for="(task, index) in TASKS"
      :key="index"
      :icon="task.icon"
      @click="() => openModal(task)"
    >
      <TooltipBase>{{ task.label }}</TooltipBase>
    </BtnBase>
  </BtnBaseGroup>
  <q-btn-dropdown
    v-else
    split
    :icon="currentTask.icon"
    auto-close
    stretch
    no-caps
    flat
    @click="() => openModal(currentTask)"
  >
    <q-list>
      <q-item
        v-for="(task, index) in TASKS"
        :key="index"
        v-close-popup
        clickable
        @click="() => openModal(task)"
      >
        <q-item-section avatar>
          <q-avatar :icon="task.icon" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ task.label }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>
