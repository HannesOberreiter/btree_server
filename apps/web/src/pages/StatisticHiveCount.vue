<template>
  <q-card flat>
    <div class="row q-pa-sm justify-center">
      <div class="col-12">
        <div class="text-h5 text-center">
          {{ $t('hiveCount') }}
        </div>
      </div>
    </div>
    <q-card-section>
      <Suspense>
        <statistic-hive-count-apiary></statistic-hive-count-apiary>
        <template #fallback>
          <global-loading></global-loading>
        </template>
      </Suspense>
    </q-card-section>

    <q-card-section>
      <Suspense>
        <statistic-hive-count-total></statistic-hive-count-total>
        <template #fallback>
          <global-loading></global-loading>
        </template>
      </Suspense>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import StatisticHiveCountApiary from '~/components/StatisticHiveCountApiary.vue';
import StatisticHiveCountTotal from '~/components/StatisticHiveCountTotal.vue';
</script>
