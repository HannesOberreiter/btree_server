<script setup lang="ts">
import type { PropType } from 'vue';
import FormMainTodo from '../components/FormMainTodo.vue';

defineProps({
  ids: {
    type: Array as PropType<number[] | null>,
    required: true
  }
});
</script>

<template>
  <div class="row q-pa-sm justify-center">
    <div class="col-12 col-sm-10 col-md-8">
      <div class="text-h5 q-pb-sm text-center">
        {{ $t('edit') }} {{ $t('todo') }}
      </div>
      <FormMainTodo :ids="ids" />
    </div>
  </div>
</template>
