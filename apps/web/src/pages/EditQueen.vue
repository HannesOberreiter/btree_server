<template>
  <q-card>
    <div class="row q-pa-sm justify-center">
      <div class="col-12 col-sm-10 col-md-8">
        <div class="text-h5 q-pb-sm text-center">
          {{ $t('edit') }} {{ $t('queen') }}
        </div>
        <form-main-queen :ids="ids"></form-main-queen>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import FormMainQueen from '~/components/FormMainQueen.vue';
defineProps({
  ids: {
    type: Array,
    required: true,
  },
});
</script>
