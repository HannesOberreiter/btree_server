<template>
  <q-td v-if="hivecount">
    {{ hivecount.count }}

    <span v-if="hivecount.grouphivescount > 0">
      [{{ hivecount.grouphivescount }}]
      <q-tooltip>
        {{ $t('hivecountTooltip') }}
      </q-tooltip>
    </span>
  </q-td>
  <q-td v-else></q-td>
</template>

<script lang="ts"></script>

<script setup lang="ts">
defineProps({
  hivecount: {
    default: null,
  },
});
</script>
