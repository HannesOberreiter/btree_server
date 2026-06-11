<script setup lang="ts">
import { escape, truncate } from 'lodash-es';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  value: {
    type: String,
    default: ''
  },
  trunc: {
    default: true
  }
});
const $q = useQuasar();
const { t } = useI18n();
function show() {
  if (!props.value) {
    return;
  }
  $q.dialog({
    title: t('note'),
    message: `<pre>${escape(props.value)}</pre>`,
    html: true
  });
}
</script>

<template>
  <q-td class="print-hide" @click="show">
    <span class="print-hide">
      {{ trunc ? truncate(value ? value : '', { length: 50 }) : value }}
    </span>
    <span class="print-only">{{ value }}</span>
  </q-td>
</template>
