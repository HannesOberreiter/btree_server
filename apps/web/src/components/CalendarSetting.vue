<template>
  <q-dialog>
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ t('setting.name', 2) }} {{ t('calendar.name') }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-toggle
          v-for="value in CALENDAR"
          size="lg"
          :key="value"
          :val="value"
          :label="value.length > 3 ? t(value.replace(/s$/, ''), 2) : t(value)"
          type="toggle"
          v-model="storeCalendar.calendar"
        >
        </q-toggle>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="OK" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useCalendarStore } from '../stores/calendar';
import { CALENDAR } from '../constants';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const storeCalendar = useCalendarStore();
</script>
