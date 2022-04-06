<template>
  <q-th>
    {{ $t(props.col.label) }}
  </q-th>
</template>

<script lang="ts">
// import { QTableSlots } from 'quasar';
type QTableSlots = {
  col: any;
  cols: any;
  colsMap: any;
  sort: (col: any) => void;
  selected: boolean;
  expand: boolean;
  color: string;
  dark: boolean;
  dense: boolean;
};
</script>

<script setup lang="ts">
import { PropType } from 'vue';

defineProps({
  props: {
    type: Object as PropType<QTableSlots>,
    required: true,
  },
});
</script>
