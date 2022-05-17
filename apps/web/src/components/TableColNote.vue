<template>
  <q-td class="print-hide" @click="show">
    <span class="print-hide">
      {{ trunc ? truncate(value ? value : '', { length: 50 }) : value }}
    </span>
    <span class="print-only">{{ value }}</span>
  </q-td>
</template>

<script setup lang="ts">
import { truncate, escape } from 'lodash-es';
import { useQuasar } from 'quasar';

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
  $q.dialog({
    title: t('note'),
    message: `<pre>${escape(props.value)}</pre>`,
    html: true,
  });
}
</script>
