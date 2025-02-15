<template>
  <q-dialog data-cy="dialog-hint">
    <q-card>
      <q-card-section>
        <div class="row">
          <div class="text-h6">{{ $t('hint') }}</div>
          <q-space />
          <btn-close-dialog></btn-close-dialog>
        </div>
      </q-card-section>
      <q-card-section class="text-body1 break-line">
        {{ $t(hint) }}
      </q-card-section>
      <q-card-actions align="right">
        <btn-base v-close-popup flat :label="$t('ok')" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import BtnCloseDialog from './BtnCloseDialog.vue';
import BtnBase from './BtnBase.vue';

defineProps({
  hint: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.break-line {
  white-space: pre-line;
}
</style>
