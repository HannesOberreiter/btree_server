<template>
  <q-dialog data-cy="dialog-calendar-setting">
    <q-card>
      <q-card-section>
        <btn-close-dialog class="float-right"></btn-close-dialog>
        <div class="text-h6">{{ $t('abo', 2) }} {{ $t('calendar') }}*</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div v-for="value in CALENDAR" :key="value">
          <q-toggle
            v-model="storeCalendar.calendar"
            size="md"
            :val="value"
            :label="
              value.length > 3 ? $t(value.replace(/s$/, ''), 2) : $t(value)
            "
            type="toggle"
          >
          </q-toggle>
        </div>
        <q-toggle
          v-model="localPerf['calendar-show-weeknumber']"
          :label="
            $t('setting.hintCalendarWeeknumber') +
            ' (' +
            $t('reloadRequired') +
            ')'
          "
        />
        <p class="text-caption q-pt-sm">*{{ $t('localSetting') }}</p>
      </q-card-section>

      <q-card-actions align="right">
        <btn-base v-close-popup flat :label="$t('ok')" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core';
import { CALENDAR } from '~/constants';
import { useCalendarStore } from '~/stores/calendar';
import BtnCloseDialog from './BtnCloseDialog.vue';

const storeCalendar = useCalendarStore();

const localPerf = useLocalStorage(
  'pref-local',
  {
    'calendar-show-weeknumber': true,
  },
  { mergeDefaults: true },
);
</script>
