<template>
  <div width="100%">
    <q-resize-observer @resize="onResize" />
    <div class="col-12">
      <div
        ref="container"
        class="calendar-container text-body1"
        :style="{ opacity }"
      >
        <full-calendar ref="cal" :options="calendarOptions"> </full-calendar>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useAuthUserStore } from '~/stores/auth';
import { useNotification } from '~/composables/useNotification';

import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/vue3';
import allLocales from '@fullcalendar/core/locales-all';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useCalendarQuery } from '~/composables/useQuery';
import { useKeyCalendar } from '~/composables/useKey';
import { useSwipeCalendar } from '~/composables/useSwipe';
import { useLocalStorage } from '@vueuse/core';
import { onMounted, ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

const useQuery = useCalendarQuery();
const { t } = useI18n();
const notification = useNotification();
const storeUser = useAuthUserStore();
const { getUser } = storeToRefs(storeUser);
const cal = ref<any | null>(null);
const container = ref<HTMLElement | null>(null);
const opacity = ref(1);
const eventDrag = ref(false);

useSwipeCalendar(cal, container, opacity, eventDrag);

const localPerf = useLocalStorage(
  'pref-local',
  { 'calendar-show-weeknumber': true },
  { mergeDefaults: true }
);

onMounted(() => {
  useKeyCalendar(cal);
});

function onResize(_size: any) {
  if (cal.value?.getApi()) {
    cal.value.getApi().updateSize();
  }
}

const handleEventClick = (clickInfo: EventClickArg) => {
  clickInfo.jsEvent.preventDefault(); // don't let the browser navigate
  const weight_difference = clickInfo.event.extendedProps.difference;
  notification.open(
    'info',
    t('weightDifference', { weight: weight_difference }),
    true
  );
};

const calendarOptions = reactive({
  eventSources: [
    {
      events: function (fetchInfo, successCallback, failureCallback) {
        useQuery.fetchQuery('scale_data', fetchInfo.start, fetchInfo.end).then(
          (response: any) => {
            successCallback(response);
          },
          (error) => {
            notification.open('negative', error);
            failureCallback(error);
          }
        );
      },
      id: 'scale',
    },
  ],
  plugins: [dayGridPlugin, listPlugin, interactionPlugin],
  headerToolbar: {
    left: 'prevYear,prev,next,nextYear today',
    right: 'title',
  },
  footerToolbar: {
    right: 'dayGridMonth,dayGridWeek,listWeek',
  },
  stickyHeaderDates: true,
  initialView: 'dayGridMonth',
  views: {
    dayGrid: {
      titleFormat: {
        year: '2-digit',
        month: 'short',
      },
    },
    month: {
      titleFormat: {
        year: '2-digit',
        month: 'short',
      },
    },
    day: {
      titleFormat: {
        year: '2-digit',
        month: 'short',
        day: 'numeric',
      },
    },
  },
  titleFormat: {
    year: '2-digit',
    month: 'short',
  },
  height: '90vh',
  locales: allLocales,
  locale: getUser.value.lang || 'en',
  weekNumbers: localPerf.value['calendar-show-weeknumber'],
  weekNumberCalculation: 'ISO',
  displayEventTime: true,
  firstDay: 1,
  selectable: false, // Allows a user to highlight multiple days or timeslots by clicking and dragging.
  dayMaxEvents: 8,
  weekends: true,
  eventClick: handleEventClick,
  eventDragStart: () => (eventDrag.value = true),
  eventDragStop: () => (eventDrag.value = false),
  eventResizeStart: () => (eventDrag.value = true),
  eventResizeStop: () => (eventDrag.value = false),
} as CalendarOptions);
</script>

<style>
/* Hide Overflown long titles in daygrid view */
.fc .fc-daygrid-event {
  overflow: hidden;
}

.fc .fc-daygrid-event-harness {
  overflow: hidden;
}

body.screen--xs .fc-toolbar-title {
  font-size: 1.3rem !important;
  line-height: normal;
  display: inline !important;
}

.fc-col-header {
  background-color: rgb(218, 154, 37);
}

.fc-footer-toolbar {
  font-size: 0.8em !important;
}
</style>
