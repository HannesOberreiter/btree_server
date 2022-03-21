<template>
  <div class="row">
    <div class="col-12 text-weight-bold text-justify">
      {{ eventInfo.note }}
    </div>
    <div v-if="eventInfo.larvae || eventInfo.hatch" class="col-12 text-center">
      {{ t('larvae') }}: {{ eventInfo.larvae }} {{ t('hatch') }}:
      {{ eventInfo.hatch }}
    </div>
    <div class="col-12">
      <ul>
        <li v-for="(item, index) in eventInfo.steps" :key="index">
          <span class="text-weight-bold q-pr-sm">{{ item.detail.job }}</span>
          <span class="float-right">
            {{ dayjs(item.date).locale(locale).format('YYYY-MM-DD dd HH') }}h
          </span>
          <div class="text-grey">
            {{ item.detail.note }}
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import 'dayjs/locale/de';

const { t, locale } = useI18n();

defineProps({
  eventInfo: {
    type: Object as any,
    required: true,
  },
});
</script>
