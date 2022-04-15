<template>
  <q-card>
    <div class="row q-pa-sm justify-center">
      <div class="col-12 col-sm-10 col-md-8">
        <div class="text-h5 q-pb-sm text-center">
          {{ $t('new') }} {{ $t('todo') }}
        </div>
        <form-main-todo></form-main-todo>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import FormMainTodo from '~/components/FormMainTodo.vue';
</script>
