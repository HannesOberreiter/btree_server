<template>
  <div class="row">
    <div class="col-12 text-weight-bold text-justify">
      {{ eventInfo.note }}
    </div>
    <div
      v-if="eventInfo.larvae || eventInfo.hatch || eventInfo.mated"
      class="col-12 text-center"
    >
      {{ $t('larvae') }}: {{ eventInfo.larvae }} {{ $t('hatch') }}:
      {{ eventInfo.hatch }} {{ $t('mated') }}: {{ eventInfo.mated }}
    </div>
    <div class="col-12">
      <ul>
        <li v-for="(item, index) in eventInfo.steps" :key="index">
          <span>
            {{ useDate.displayFormat(item.date, 'rearing') }}
          </span>
          <br />
          <span class="text-weight-bold q-pr-sm">{{ item.detail.job }}</span>

          <div class="text-grey">
            {{ item.detail.note }}
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDateFormat } from '~/composables/useDate';

const useDate = useDateFormat();
defineProps({
  eventInfo: {
    type: Object as any,
    required: true,
  },
});
</script>
