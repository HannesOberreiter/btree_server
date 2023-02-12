<template>
  <q-td
    :props="parentProps"
    data-cy="col-pedigree"
    class="show-pointer"
    @click="show"
  >
    {{ parentProps.value }}
  </q-td>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import DialogPedigree from './DialogPedigree.vue';
import { toRef } from 'vue';

const $q = useQuasar();
const props = defineProps({
  parentProps: {
    type: Object,
    required: true,
  },
});

const parentProps = toRef(props, 'parentProps');

function show() {
  $q.dialog({
    component: DialogPedigree,
    componentProps: {
      id: parentProps.value.row.id,
    },
  });
}
</script>
