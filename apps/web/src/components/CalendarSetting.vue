<template>
  <q-dialog data-cy="dialog-calendar-setting">
    <q-card>
      <q-card-section>
        <btn-close-dialog class="float-right"></btn-close-dialog>
        <div class="text-h6">
          {{ $t('setting.name', 2) }} {{ $t('calendar') }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-toggle
          v-for="value in CALENDAR"
          :key="value"
          v-model="storeCalendar.calendar"
          size="lg"
          :val="value"
          :label="value.length > 3 ? $t(value.replace(/s$/, ''), 2) : $t(value)"
          type="toggle"
        >
        </q-toggle>
      </q-card-section>

      <q-card-actions align="right">
        <btn-base v-close-popup flat :label="$t('ok')" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { CALENDAR } from '~/constants';
import { useCalendarStore } from '~/stores/calendar';
const storeCalendar = useCalendarStore();
</script>
