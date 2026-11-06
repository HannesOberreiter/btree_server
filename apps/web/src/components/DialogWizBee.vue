<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import BtnCloseDialog from './BtnCloseDialog.vue';
import WizBeeChat from './WizBeeChat.vue';

const viewportStyle = ref<Record<string, string>>({});

function updateViewport() {
  const viewport = window.visualViewport;
  viewportStyle.value = {
    '--wizbee-viewport-height': `${viewport?.height ?? window.innerHeight}px`,
    '--wizbee-viewport-top': `${viewport?.offsetTop ?? 0}px`
  };
}

onMounted(() => {
  updateViewport();
  window.visualViewport?.addEventListener('resize', updateViewport);
  window.visualViewport?.addEventListener('scroll', updateViewport);
  window.addEventListener('resize', updateViewport);
});

onBeforeUnmount(() => {
  window.visualViewport?.removeEventListener('resize', updateViewport);
  window.visualViewport?.removeEventListener('scroll', updateViewport);
  window.removeEventListener('resize', updateViewport);
});
</script>

<template>
  <q-dialog
    class="dialog-wizbee-viewport"
    :maximized="$q.screen.lt.md"
    :style="viewportStyle"
    @before-show="updateViewport"
  >
    <q-card class="dialog-wizbee">
      <q-card-section class="dialog-wizbee__header row items-center q-pb-none">
        <div class="row items-center q-gutter-x-sm">
          <img
            src="/wizbee/favicon-96x96.png"
            alt="WizBee"
            height="24"
            :class="{ 'invert-colors': $q.dark.isActive }"
          />
          <div class="text-h6"> WizBee </div>
        </div>
        <q-space />
        <BtnCloseDialog />
      </q-card-section>
      <q-card-section class="dialog-wizbee__body q-pa-none">
        <WizBeeChat :show-examples="false" :is-dialog="true" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.dialog-wizbee {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-wizbee__header {
  flex-shrink: 0;
}

@media (max-width: 1023px) {
  /* Fit the whole dialog above the keyboard; the composer stays in normal flow. */
  .dialog-wizbee-viewport :deep(.q-dialog__inner) {
    top: var(--wizbee-viewport-top, 0px);
    height: var(--wizbee-viewport-height, 100dvh);
    bottom: auto;
  }
}

@media (min-width: 1024px) {
  .dialog-wizbee {
    height: 85vh;
    min-width: 75vw;
    min-height: 85vh;
  }
}

.dialog-wizbee__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.invert-colors {
  filter: grayscale(1) invert(1);
}
</style>
