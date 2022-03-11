<template>
  <form-common-dates></form-common-dates>
  <form-common-hive></form-common-hive>
  <form-common-dropdown
    v-if="task === 'checkup'"
    table="checkup_types"
  ></form-common-dropdown>
  <form-common-dropdown
    v-else-if="task === 'harvest'"
    table="harvest_types"
  ></form-common-dropdown>
  <div v-else-if="task === 'treatment'">
    <form-common-dropdown table="treatment_types"></form-common-dropdown>
    <form-common-dropdown2 table="treatment_diseases"></form-common-dropdown2>
  </div>
  <form-common-dropdown
    v-else-if="task === 'feed'"
    table="feed_types"
  ></form-common-dropdown>

  <form-common-note></form-common-note>
</template>

<script setup lang="ts">
import FormCommonHive from 'src/components/FormCommonHive.vue';
import { useI18n } from 'vue-i18n';
import FormCommonDates from 'src/components/FormCommonDates.vue';
import FormCommonDropdown from 'src/components/FormCommonDropdown.vue';
import FormCommonDropdown2 from 'src/components/FormCommonDropdown.vue';
import FormCommonNote from 'src/components/FormCommonNote.vue';

import { PropType } from 'vue';
import { Task } from 'src/types';

const props = defineProps({
  task: {
    type: String as PropType<Task>,
    required: true,
  },
});
console.log(props.task);
</script>
