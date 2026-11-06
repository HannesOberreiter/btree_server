<script setup lang="ts">
import type {
  CalendarOptions,
  DateClickInfo,
  EventChangeInfo,
  EventClickInfo,
  EventSourceInput
} from '@fullcalendar/vue3';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/vue3/daygrid';
import interactionPlugin from '@fullcalendar/vue3/interaction';
import listPlugin from '@fullcalendar/vue3/list';
import allLocales from '@fullcalendar/vue3/locales-all';
import multiMonthPlugin from '@fullcalendar/vue3/multimonth';
import themePlugin from '@fullcalendar/vue3/themes/classic';
import '@fullcalendar/vue3/skeleton.css';
import '@fullcalendar/vue3/themes/classic/theme.css';
import '@fullcalendar/vue3/themes/classic/palette.css';
import { useLocalStorage } from '@vueuse/core';

import dayjs from 'dayjs';
import { difference, map, remove } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import CalendarSetting from '../components/CalendarSetting.vue';

import DialogEvent from '../components/DialogEvent.vue';
import DialogForm from '../components/DialogForm.vue';
import { useApiFetch } from '../composables/useApi';
import useCalendarVis from '../composables/useCalendarVis';
import { useKeyCalendar } from '../composables/useKey';
import { useNotification } from '../composables/useNotification';
import { useCalendarQuery } from '../composables/useQuery';
import { useSwipeCalendar } from '../composables/useSwipe';
import { CALENDAR } from '../constants';
import { toCalendarDialogEvent, toCalendarEvent } from '../helpers/calendar';
import { useAuthUserStore } from '../stores/auth';
import { useCalendarStore } from '../stores/calendar';

const useQuery = useCalendarQuery();
const { t } = useI18n();
const $q = useQuasar();
const api = useApiFetch();
const notification = useNotification();
const vis = useCalendarVis();
const storeUser = useAuthUserStore();
const { getPaidStatus, getUser } = storeToRefs(storeUser);
const storeCalendar = useCalendarStore();

const eventsSourceList: EventSourceInput[] = [];
const eventsSourceActive: EventSourceInput[] = [];
const eventsSourceInactive: EventSourceInput[] = [];
let eventsSourceActiveWatcher = storeCalendar.calendar;
const dateClicked = ref<string | null>(null);
const cal = ref<any | null>(null);
const container = ref<HTMLElement | null>(null);
const opacity = ref(1);
const eventDrag = ref(false);
const showSetting = ref(false);

useSwipeCalendar(cal, container, opacity, eventDrag);

const localPerf = useLocalStorage(
  'pref-local',
  { 'calendar-show-weeknumber': true },
  { mergeDefaults: true }
);

const VIEWS = ['dayGridMonth', 'months', 'dayGridWeek', 'listWeek'] as const;

const localLastView = useLocalStorage<{
  view: (typeof VIEWS)[number];
  date: string | undefined;
  dateTimestamp: number;
}>(
  'calendar-last-view',
  {
    view: 'dayGridMonth',
    date: undefined,
    dateTimestamp: Date.now()
  },
  { mergeDefaults: true }
);

function formDialog(date: string) {
  return $q
    .dialog({
      component: DialogForm,
      componentProps: {
        title: 'newTodo',
        form: 'todo',
        date
      }
    })
    .onOk(() => {
      refetchSource('todo');
    });
}
function eventDialog(event: any) {
  return $q
    .dialog({
      component: DialogEvent,
      componentProps: {
        eventInfo: event
      }
    })
    .onOk(source => {
      refetchSource(source);
    });
}

CALENDAR.forEach((source, _index) => {
  if (source === 'vis') {
    eventsSourceList.push({
      events(fetchInfo, successCallback, _failureCallback) {
        const result = vis.render(fetchInfo);
        successCallback(result);
      },
      id: source
    });
  } else {
    eventsSourceList.push({
      events(fetchInfo, successCallback, failureCallback) {
        useQuery.fetchQuery(source, fetchInfo.start, fetchInfo.end).then(
          response => {
            successCallback(response.map(toCalendarEvent));
          },
          error => {
            notification.open('negative', error);
            failureCallback(error);
          }
        );
      },
      id: source
    });
  }
});

eventsSourceList.forEach((source: any) => {
  if (storeCalendar.calendar.includes(source.id)) {
    eventsSourceActive.push(source);
  } else {
    eventsSourceInactive.push(source);
  }
});

onBeforeRouteLeave(() => {
  useQuery.invalidate('');
});

onMounted(() => {
  useKeyCalendar(cal);
  watch(storeCalendar, currentValue => {
    const calendarApi = cal.value.getApi();
    const addSources = difference(
      currentValue.calendar,
      eventsSourceActiveWatcher
    );
    const removeSources = difference(
      eventsSourceActiveWatcher,
      currentValue.calendar
    );
    eventsSourceActiveWatcher = currentValue.calendar;
    eventsSourceList.forEach((source: any) => {
      if (addSources.includes(source.id)) {
        eventsSourceActive.push(source);
        remove(eventsSourceInactive, { id: source.id });
        calendarApi.addEventSource(source);
      } else if (removeSources.includes(source.id)) {
        eventsSourceInactive.push(source);
        remove(eventsSourceActive, { id: source.id });
        calendarApi.getEventSourceById(source.id).remove();
      }
    });
  });
});

function refetchSource(event: string) {
  if (!cal.value) {
    return;
  }
  const calendarApi = cal.value.getApi();
  const source = calendarApi.getEventSourceById(event);
  useQuery.invalidate(event);
  // client.clear();
  source.refetch();
}

function handleEventsChange(changeInfo: EventChangeInfo) {
  // Single Day Events no Enddate possible
  if (
    changeInfo.event.extendedProps.table === 'todo' ||
    changeInfo.event.extendedProps.table === 'movedate'
  ) {
    if (changeInfo.event.end) {
      changeInfo.revert();
      return void 0;
    }
  }

  let ids: string | string[] = '';
  let start = '';
  if (changeInfo.event.extendedProps.table === 'rearing') {
    // For Queen Rearing Events
    // we need to find out which is the starting step
    // and how it will be changed based on the difference if the moved event is not the starting step
    ids = [changeInfo.event.groupId.replace('Q', '')];
    const startPosition = changeInfo.event.extendedProps.startPosition;
    const currentPosition = changeInfo.event.extendedProps.currentStep.position;
    if (startPosition === currentPosition) {
      start = dayjs(changeInfo.event.start).toISOString();
    } else {
      const difference = dayjs(changeInfo.event.start).diff(
        dayjs(changeInfo.event.extendedProps.currentStep.date)
      );
      let startStep: any = '';
      map(changeInfo.event.extendedProps.steps, value => {
        if (value.position === startPosition) {
          startStep = value;
        }
      });
      start = dayjs(startStep.date)
        .add(difference, 'milliseconds')
        .toISOString();
    }
  } else {
    ids = changeInfo.event.extendedProps.task_ids.toString().split(',');
    start = dayjs(changeInfo.event.start).format('YYYY-MM-DD');
  }

  const data = JSON.stringify({
    start,
    end: dayjs(changeInfo.event.end).subtract(1, 'day').format('YYYY-MM-DD'),
    ids
  });
  const sourceName = changeInfo.event.extendedProps.table;
  api.patch(`/v1/${sourceName}/date`, data).then(
    (_response: any) => {
      notification.open('positive', '');
      useQuery.invalidate(sourceName);
    },
    error => {
      notification.open('negative', error);
      changeInfo.revert();
    }
  );
  return true;
}
function handleDateClick(selectInfo: DateClickInfo) {
  const dateInfo = dayjs(selectInfo.date).format('YYYY-MM-DD');
  if (dateClicked.value === dateInfo) {
    dateClicked.value = null;
    formDialog(dateInfo);
  } else {
    dateClicked.value = dateInfo;
    setTimeout(() => (dateClicked.value = null), 300); // Reduced timeout for better responsiveness
  }
}
function handleEventClick(clickInfo: EventClickInfo) {
  clickInfo.jsEvent.preventDefault(); // don't let the browser navigate

  eventDialog(toCalendarDialogEvent(clickInfo.event));
}

let initialDate;
if (
  localLastView.value.date &&
  Date.now() - localLastView.value.dateTimestamp <= 1000 * 60 * 10
) {
  initialDate = localLastView.value.date;
}

const calendarOptions = reactive({
  eventSources: eventsSourceActive,
  plugins: [
    themePlugin,
    dayGridPlugin,
    listPlugin,
    interactionPlugin,
    multiMonthPlugin
  ],
  toolbarTitleClass: 'calendar-toolbar-title',
  footerToolbarClass: 'calendar-footer-toolbar',
  buttonClass: 'calendar-toolbar-button',
  eventInnerClass: 'calendar-event-content',
  listItemEventBeforeClass: ({ event }) =>
    event.extendedProps.table === 'rearing' ? 'calendar-rearing-marker' : '',
  buttons: {
    dayGridMonth: { text: t('month') },
    months: { text: t('month', 2) },
    listWeek: { text: t('event', 2) },
    dayGridWeek: { text: t('week') },
    sources: {
      text: t('abo', 2),
      click() {
        showSetting.value = true;
      }
    }
  },
  headerToolbar: {
    left: 'prevYear,prev,next,nextYear today',
    right: 'title'
  },
  footerToolbar: {
    left: 'sources',
    right: VIEWS.join(',')
  },
  tableHeaderSticky: true,
  initialView: localLastView.value.view,
  views: {
    dayGrid: {
      eventClass: 'calendar-daygrid-event',
      tableHeaderClass: 'calendar-daygrid-header',
      titleFormat: {
        year: '2-digit',
        month: 'short'
      }
    },
    dayGridWeek: {
      dayMaxEvents: true
    },
    month: {
      titleFormat: {
        year: '2-digit',
        month: 'short'
      }
    },
    months: {
      type: 'multiMonth',
      eventClass: 'calendar-daygrid-event',
      tableHeaderClass: 'calendar-daygrid-header',
      duration: { months: 4 },
      showNonCurrentDates: false,
      titleFormat: {
        year: '2-digit'
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
  editable: getPaidStatus.value.rank.id !== 3,
  weekNumbers: localPerf.value['calendar-show-weeknumber'],
  weekNumberCalculation: 'ISO',
  displayEventTime: true,
  firstDay: 1,
  selectable: false, // Allows a user to highlight multiple days or timeslots by clicking and dragging.
  dayMaxEvents: 8,
  weekends: true,
  dateClick: handleDateClick,
  eventClick: handleEventClick,
  eventChange: handleEventsChange,
  eventDragStart: () => (eventDrag.value = true),
  eventDragStop: () => (eventDrag.value = false),
  eventResizeStart: () => (eventDrag.value = true),
  eventResizeStop: () => (eventDrag.value = false),
  datesSet(dateInfo) {
    localLastView.value.view = dateInfo.view.type as (typeof VIEWS)[number];
    localLastView.value.date = dateInfo.startStr;
    if (dateInfo.endStr) {
      localLastView.value.date = dayjs(dateInfo.startStr)
        .add(
          dayjs(dateInfo.endStr).diff(dayjs(dateInfo.startStr)) / 2,
          'milliseconds'
        )
        .toISOString();
    }
    localLastView.value.dateTimestamp = Date.now();
  },
  initialDate
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
        <FullCalendar ref="cal" :options="calendarOptions">
          <template #eventContent="{ timeText, event }">
            <i
              v-if="event.extendedProps.table === 'rearing'"
              :style="`background-color: ${event.color}; color: black;`"
              :class="event.extendedProps.icon"
            />
            <i v-else :class="event.extendedProps.icon" />
            {{ timeText }}
            {{ event.title }}
          </template>
        </FullCalendar>
      </div>
      <CalendarSetting v-model="showSetting" />
    </div>
  </div>
</template>

<style>
.calendar-rearing-marker {
  display: none;
}

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
