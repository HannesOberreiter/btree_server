<template>
  <form-common-dates></form-common-dates>
  <form-common-hive></form-common-hive>
  <div class="q-mb-sm q-mt-sm">
    <div v-if="task === 'checkup'">
      <form-common-dropdown
        v-if="task === 'checkup'"
        table="checkup_types"
      ></form-common-dropdown>
      <form-checkup-queen></form-checkup-queen>
      <form-checkup-rating></form-checkup-rating>
      <form-checkup-frames></form-checkup-frames>
      <form-checkup-varroa></form-checkup-varroa>
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
</template>

<script setup lang="ts">
import FormCommonHive from 'src/components/FormCommonHive.vue';
import { useI18n } from 'vue-i18n';
import FormCommonDates from 'src/components/FormCommonDates.vue';
import FormCommonDropdown from 'src/components/FormCommonDropdown.vue';
import FormCommonDropdown2 from 'src/components/FormCommonDropdown.vue';
import FormCommonNote from 'src/components/FormCommonNote.vue';
import FormCommonUrl from 'src/components/FormCommonUrl.vue';

import { PropType } from 'vue';
import { Task } from 'src/types';
import FormCheckupQueen from './FormCheckupQueen.vue';
import FormCheckupRating from './FormCheckupRating.vue';
import FormCheckupFrames from './FormCheckupFrames.vue';
import FormCheckupVarroa from './FormCheckupVarroa.vue';

const props = defineProps({
  task: {
    type: String as PropType<Task>,
    required: true,
  },
});
console.log(props.task);
</script>
