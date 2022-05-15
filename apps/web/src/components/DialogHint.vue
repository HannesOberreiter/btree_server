<template>
  <q-dialog>
    <q-card>
      <q-card-section class="text-body1">
        {{ $t(hint) }}
      </q-card-section>
      <q-card-actions align="right">
        <btn-base v-close-popup flat :label="$t('ok')" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
defineProps({
  hint: {
    type: String,
    required: true,
  },
});
</script>
