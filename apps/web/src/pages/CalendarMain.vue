<template>
  <div width="100%">
    <q-resize-observer @resize="onResize" />
    <div class="col-12">
      <div class="calendar-container text-body1">
        <full-calendar ref="cal" :options="calendarOptions">
          <template #eventContent="{ timeText, event }">
            <i
              v-if="event.extendedProps.table === 'rearing'"
              :style="`background-color: ${event.backgroundColor}`"
              :class="event.extendedProps.icon"
            ></i>
            <i v-else :class="event.extendedProps.icon"></i>
            {{ timeText }}
            {{ event.title }}
          </template>
        </full-calendar>
      </div>
      <dialog-hint v-model="showInfo" hint="calendar.hint"></dialog-hint>
      <calendar-setting v-model="showSetting"></calendar-setting>
    </div>
  </div>
</template>
<script setup lang="ts">
import { remove, map, difference, merge } from 'lodash-es';
import dayjs from 'dayjs';
import { CALENDAR } from '~/constants';
import { onKeyStroke } from '@vueuse/core';
import { useAuthUserStore } from '~/stores/auth';
import { useCalendarStore } from '~/stores/calendar';
import useCalendarVis from '~/composables/useCalendarVis';
import { useNotification } from '~/composables/useNotification';

import DialogEvent from '~/components/DialogEvent.vue';
import DialogForm from '~/components/DialogForm.vue';
import DialogHint from '~/components/DialogHint.vue';

import '@fullcalendar/core/vdom'; // solve problem with Vite
import FullCalendar, {
  CalendarOptions,
  EventClickArg,
  EventChangeArg,
  EventSourceInput,
} from '@fullcalendar/vue3';
import allLocales from '@fullcalendar/core/locales-all';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useApiFetch } from '~/composables/useApi';
import { useQuasar } from 'quasar';
import { useCalendarQuery } from '~/composables/useQuery';

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
const dateClicked = ref(dayjs().format('YYYY-MM-DD'));
const cal = ref();
const showInfo = ref(false);
const showSetting = ref(false);

const formDialog = () =>
  $q
    .dialog({
      component: DialogForm,
      componentProps: {
        title: 'newTodo',
        form: 'todo',
        date: dateClicked.value,
      },
    })
    .onOk(() => {
      refetchSource('todo');
    });
const eventDialog = (event: any) =>
  $q
    .dialog({
      component: DialogEvent,
      componentProps: {
        eventInfo: event,
      },
    })
    .onOk((source) => {
      refetchSource(source);
    });

CALENDAR.map(function (source, _index) {
  if (source === 'vis') {
    eventsSourceList.push({
      events: function (fetchInfo, successCallback, _failureCallback) {
        const result = vis.render(fetchInfo);
        successCallback(result);
      },
      id: source,
    });
  } else {
    eventsSourceList.push({
      events: function (fetchInfo, successCallback, failureCallback) {
        useQuery.fetchQuery(source, fetchInfo.start, fetchInfo.end).then(
          (response: any) => {
            successCallback(response);
          },
          (error) => {
            notification.open('negative', error);
            failureCallback(error);
          }
        );
      },
      id: source,
    });
  }
});

eventsSourceList.map(function (source: any) {
  if (storeCalendar.calendar.includes(source.id)) {
    eventsSourceActive.push(source);
  } else {
    eventsSourceInactive.push(source);
  }
});

onMounted(() => {
  onKeyStroke('ArrowLeft', (e) => {
    e.preventDefault();
    if (cal.value.getApi()) cal.value.getApi().prev();
  });
  onKeyStroke('ArrowRight', (e) => {
    e.preventDefault();
    if (cal.value.getApi()) cal.value.getApi().next();
  });
  watch(storeCalendar, (currentValue) => {
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
    eventsSourceList.map(function (source: any) {
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

const refetchSource = (event: string) => {
  if (!cal.value) return;
  const calendarApi = cal.value.getApi();
  const source = calendarApi.getEventSourceById(event);
  useQuery.invalidate(event);
  //client.clear();
  source.refetch();
};

function onResize(_size: any) {
  cal.value.getApi().updateSize();
}

function handleEventsChange(changeInfo: EventChangeArg) {
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

  let ids = '';
  let start = '';
  if (changeInfo.event.extendedProps.table === 'rearing') {
    // For Queen Rearing Events
    // we need to find out which is the starting step
    // and how it will be changed based on the difference if the moved event is not the starting step
    ids = changeInfo.event.groupId.replace('Q', '');
    const startPosition = changeInfo.event.extendedProps.startPosition;
    const currentPosition = changeInfo.event.extendedProps.currentStep.position;
    if (startPosition === currentPosition) {
      start = dayjs(changeInfo.event.start).format('YYYY-MM-DD HH:mm:ss');
    } else {
      const difference = dayjs(changeInfo.event.start).diff(
        dayjs(changeInfo.event.extendedProps.currentStep.date)
      );
      let startStep: any = '';
      map(changeInfo.event.extendedProps.steps, function (value) {
        if (value.position === startPosition) startStep = value;
      });
      start = dayjs(startStep.date)
        .add(difference, 'miliseconds')
        .format('YYYY-MM-DD HH:mm:ss');
    }
  } else {
    ids = changeInfo.event.extendedProps.task_ids.toString().split(',');
    start = dayjs(changeInfo.event.start).format('YYYY-MM-DD');
  }

  const data = JSON.stringify({
    start: start,
    end: dayjs(changeInfo.event.end).subtract(1, 'day').format('YYYY-MM-DD'),
    ids: ids,
  });
  const sourceName = changeInfo.event.extendedProps.table;
  api.patch(`/v1/${sourceName}/date`, data).then(
    (_response: any) => {
      notification.open('positive', '');
      useQuery.invalidate(sourceName);
    },
    (error) => {
      notification.open('negative', error);
      changeInfo.revert();
    }
  );
  return true;
}
function handleDateClick(selectInfo: DateClickArg) {
  if (dateClicked.value === dayjs(selectInfo.date).format('YYYY-MM-DD')) {
    dateClicked.value = null;
    formDialog();
  } else {
    dateClicked.value = dayjs(selectInfo.date).format('YYYY-MM-DD');
    setTimeout(() => (dateClicked.value = null), 550); // Timeout to simulate a double click
  }
}
function handleEventClick(clickInfo: EventClickArg) {
  clickInfo.jsEvent.preventDefault(); // don't let the browser navigate

  const event = {
    ...merge(
      clickInfo.event._instance?.range,
      clickInfo.event._def,
      clickInfo.event.extendedProps
    ),
  };
  eventDialog(event);
}

const calendarOptions = reactive({
  eventSources: eventsSourceActive,
  plugins: [dayGridPlugin, listPlugin, interactionPlugin],
  customButtons: {
    sources: {
      text: t('setting.name', 2),
      click: function () {
        showSetting.value = true;
      },
    },
    info: {
      text: 'Info',
      click: function () {
        showInfo.value = true;
      },
    },
  },
  headerToolbar: {
    left: 'prevYear,prev,next,nextYear today',
    right: 'title',
  },
  footerToolbar: {
    left: 'sources,info',
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
  editable: getPaidStatus.value.rank.id === 3 ? false : true,
  weekNumbers: true,
  weekNumberCalculation: 'ISO',
  displayEventTime: true,
  firstDay: 1,
  selectable: false, // Allows a user to highlight multiple days or timeslots by clicking and dragging.
  dayMaxEvents: 8,
  weekends: true,
  dateClick: handleDateClick,
  eventClick: handleEventClick,
  eventChange: handleEventsChange,
} as CalendarOptions);
</script>

<style>
.calendar-container {
  //height: 80vh;
}

// Hide Overflown long titles in daygrid view
.fc .fc-daygrid-event {
  overflow: hidden;
}

.fc .fc-daygrid-event-harness {
  overflow: hidden;
}

// Toolbar Buttons and text
.fc-toolbar {
  text-align: center;
  // smaller text and inline buttons on small devices
  @include media-breakpoint-down(sm) {
    display: inline;
    .fc-toolbar-title {
      font-size: 20px;
      line-height: normal;
      display: inline !important;
    }
  }
}

.fc-col-header {
  background-color: rgb(218, 154, 37);
}
</style>
