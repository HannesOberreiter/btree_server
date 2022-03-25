<template>
  <q-card>
    <div class="row q-pa-sm justify-center">
      <div class="col-12 col-sm-10 col-md-8">
        <div class="text-h5 q-pb-sm text-center">
          {{ $t(ids ? 'edit' : 'new') }} {{ $t('queen') }}
        </div>
        <form-main-queen
          :key="router.currentRoute.value + ''"
          :ids="ids ? ids : undefined"
        ></form-main-queen>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import FormMainQueen from '~/components/FormMainQueen.vue';

const router = useRouter();
defineProps({
  ids: {
    default: null,
  },
});
</script>
