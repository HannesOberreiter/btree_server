<template>
  <div class="row q-pa-sm justify-center">
    <div class="col-12 col-sm-10 col-md-8">
      <div class="text-h5 q-pb-sm text-center">
        {{ $t('edit') }} {{ $t('todo') }}
      </div>
      <form-main-todo :ids="ids"></form-main-todo>
    </div>
  </div>
</template>

<script setup lang="ts">
import FormMainTodo from '../components/FormMainTodo.vue';

defineProps({
  ids: {
    type: Array,
    required: true,
  },
});
</script>
