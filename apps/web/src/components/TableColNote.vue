<template>
  <q-td @click="show">
    {{ trunc ? truncate(value ? value : '', { length: 50 }) : value }}
  </q-td>
</template>

<script lang="ts">
import { truncate } from 'lodash';
</script>

<script setup lang="ts">
const $q = useQuasar();
const { t } = useI18n();
const props = defineProps({
  value: {
    type: String,
    default: '',
  },
  trunc: {
    default: true,
  },
});

function show() {
  if (!props.value) return;
  if (props.value.length > 50)
    $q.dialog({ title: t('note'), message: props.value, html: true });
}
</script>
