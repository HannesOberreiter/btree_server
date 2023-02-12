<template>
  <q-td v-if="hivecount">
    {{ hivecount.count }}

    <span v-if="hivecount.grouphivescount > 0">
      [{{ hivecount.grouphivescount }}]
      <tooltip-base>
        {{ $t('hivecountTooltip') }}
      </tooltip-base>
    </span>
  </q-td>
  <q-td v-else></q-td>
</template>

<script setup lang="ts">
defineProps({
  hivecount: {
    default: null,
  },
});
</script>
