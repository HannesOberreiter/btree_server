<template>
  <q-card>
    <div class="row q-pa-sm justify-center">
      <div class="col-12 col-sm-10 col-md-8">
        <div class="text-body2 q-pb-sm text-center">
          {{ t('quicktool.name') }}
        </div>
        <form-common-dates></form-common-dates>
        <form-common-hive></form-common-hive>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import FormCommonHive from 'src/components/FormCommonHive.vue';
import { useI18n } from 'vue-i18n';
import FormCommonDates from 'src/components/FormCommonDates.vue';

defineProps({
  task: {
    type: String,
    default: 'checkup',
  },
  type: {
    type: String,
    default: 'hive',
  },
  id: {
    type: String,
    default: '',
  },
});

const { t } = useI18n();
</script>
