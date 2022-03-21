<template>
  <q-dialog>
    <q-card>
      <q-card-section class="text-body1">
        {{ t(hint) }}
      </q-card-section>
      <q-card-actions align="right">
        <q-btn v-close-popup flat label="OK" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
defineProps({
  hint: {
    type: String,
    required: true,
  },
});
</script>
