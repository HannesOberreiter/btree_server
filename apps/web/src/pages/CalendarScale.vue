<script setup lang="ts">
import type { CalendarOptions, EventClickInfo } from '@fullcalendar/vue3';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/vue3/daygrid';
import interactionPlugin from '@fullcalendar/vue3/interaction';
import listPlugin from '@fullcalendar/vue3/list';
import allLocales from '@fullcalendar/vue3/locales-all';
import themePlugin from '@fullcalendar/vue3/themes/classic';
import '@fullcalendar/vue3/skeleton.css';
import '@fullcalendar/vue3/themes/classic/theme.css';
import '@fullcalendar/vue3/themes/classic/palette.css';
import { useLocalStorage } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useKeyCalendar } from '../composables/useKey';
import { useNotification } from '../composables/useNotification';
import { useCalendarQuery } from '../composables/useQuery';
import { useSwipeCalendar } from '../composables/useSwipe';
import { toCalendarEvent } from '../helpers/calendar';
import { useAuthUserStore } from '../stores/auth';

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

function handleEventClick(clickInfo: EventClickInfo) {
  clickInfo.jsEvent.preventDefault(); // don't let the browser navigate
  const weight_difference = clickInfo.event.extendedProps.difference;
  notification.open(
    'info',
    t('weightDifference', { weight: weight_difference }),
    true
  );
}

const calendarOptions = reactive({
  eventSources: [
    {
      events(fetchInfo, successCallback, failureCallback) {
        useQuery.fetchQuery('scale_data', fetchInfo.start, fetchInfo.end).then(
          response => {
            successCallback(response.map(toCalendarEvent));
          },
          error => {
            notification.open('negative', error);
            failureCallback(error);
          }
        );
      },
      id: 'scale'
    }
  ],
  plugins: [themePlugin, dayGridPlugin, listPlugin, interactionPlugin],
  toolbarTitleClass: 'calendar-toolbar-title',
  footerToolbarClass: 'calendar-footer-toolbar',
  buttonClass: 'calendar-toolbar-button',
  eventInnerClass: 'calendar-event-content',
  headerToolbar: {
    left: 'prevYear,prev,next,nextYear today',
    right: 'title'
  },
  footerToolbar: {
    right: 'dayGridMonth,dayGridWeek,listWeek'
  },
  tableHeaderSticky: true,
  initialView: 'dayGridMonth',
  views: {
    dayGrid: {
      eventClass: 'calendar-daygrid-event',
      tableHeaderClass: 'calendar-daygrid-header',
      titleFormat: {
        year: '2-digit',
        month: 'short'
      }
    },
    month: {
      titleFormat: {
        year: '2-digit',
        month: 'short'
      }
    },
    day: {
      titleFormat: {
        year: '2-digit',
        month: 'short',
        day: 'numeric'
      }
    }
  },
  titleFormat: {
    year: '2-digit',
    month: 'short'
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
  eventResizeStop: () => (eventDrag.value = false)
} as CalendarOptions);
</script>

<template>
  <div width="100%">
    <div class="col-12">
      <div
        ref="container"
        class="calendar-container text-body1"
        :data-color-scheme="$q.dark.isActive ? 'dark' : 'light'"
        :style="{ opacity }"
      >
        <FullCalendar ref="cal" :options="calendarOptions" />
      </div>
    </div>
  </div>
</template>

<style>
.calendar-event-content {
  letter-spacing: -0.2px;
}

/* Hide Overflown long titles in daygrid view */
.calendar-daygrid-event {
  overflow: hidden;
  white-space: nowrap;
}

body.screen--xs .calendar-toolbar-title {
  font-size: 1.3rem !important;
  line-height: normal;
  display: inline !important;
}

.calendar-daygrid-header {
  background-color: rgb(218, 154, 37);
}

.calendar-footer-toolbar .calendar-toolbar-button {
  font-size: 12px;
  padding: 4px 8px;
}
</style>
