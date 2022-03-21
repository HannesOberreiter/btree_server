<template>
  <form-common-hive v-model="state.hive"></form-common-hive>
  <form-common-dates></form-common-dates>
  <div class="q-mb-sm q-mt-sm">
    <div v-if="task === 'checkup'">
      <form-common-dropdown
        v-if="task === 'checkup'"
        table="checkup_types"
      ></form-common-dropdown>
      <form-checkup-queen></form-checkup-queen>
      <form-checkup-rating></form-checkup-rating>
      <form-checkup-frames></form-checkup-frames>
      <div class="row q-pt-sm q-pb-sm">
        <div class="col-12 col-md-6">
          <form-checkup-varroa></form-checkup-varroa>
        </div>
      </div>
      <div class="row q-pt-sm q-pb-sm">
        <div class="col-12 col-md-6">
          <form-checkup-strength></form-checkup-strength>
        </div>
      </div>
      <div class="q-pt-sm q-pb-sm">
        <form-checkup-weight></form-checkup-weight>
      </div>
      <div class="row q-pt-sm q-pb-sm">
        <div class="col-12 col-md-6">
          <form-checkup-temperature
            :hive="state.hive"
          ></form-checkup-temperature>
        </div>
      </div>
    </div>
    <form-common-dropdown
      v-else-if="task === 'harvest'"
      table="harvest_types"
    ></form-common-dropdown>
    <div v-else-if="task === 'treatment'" class="row">
      <div class="col-12 col-md-6">
        <form-common-dropdown table="treatment_types"></form-common-dropdown>
      </div>
      <div class="col-12 col-md-6">
        <form-common-dropdown2
          table="treatment_diseases"
          label="disease"
        ></form-common-dropdown2>
      </div>
    </div>
    <form-common-dropdown
      v-else-if="task === 'feed'"
      table="feed_types"
    ></form-common-dropdown>
  </div>
  <form-common-url></form-common-url>
  <form-common-note></form-common-note>
  <form-common-done></form-common-done>

  <q-btn-group>
    <q-btn>{{ t('save') }}</q-btn>
    <q-btn>{{ t('reset') }}</q-btn>
  </q-btn-group>
</template>

<script setup lang="ts">
import { PropType, ref } from 'vue';
import { Task } from '~/types';
import { useI18n } from 'vue-i18n';
import FormCheckupFrames from './FormCheckupFrames.vue';
import FormCheckupQueen from './FormCheckupQueen.vue';
import FormCheckupRating from './FormCheckupRating.vue';
import FormCheckupStrength from './FormCheckupStrength.vue';
import FormCheckupTemperature from './FormCheckupTemperature.vue';
import FormCheckupVarroa from './FormCheckupVarroa.vue';
import FormCheckupWeight from './FormCheckupWeight.vue';
import FormCommonDates from '~/components/FormCommonDates.vue';
import FormCommonDone from './FormCommonDone.vue';
import FormCommonDropdown from '~/components/FormCommonDropdown.vue';
import FormCommonDropdown2 from '~/components/FormCommonDropdown.vue';
import FormCommonHive from '~/components/FormCommonHive.vue';
import FormCommonNote from '~/components/FormCommonNote.vue';
import FormCommonUrl from '~/components/FormCommonUrl.vue';

const props = defineProps({
  task: {
    type: String as PropType<Task>,
    required: true,
  },
});

const state = ref({
  hive: [],
});

const { t } = useI18n();
console.log(props.task);
</script>
