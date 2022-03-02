<template>
  <div width="100%">
    <q-resize-observer @resize="onResize" />
    <div class="col-12">
      <div class="calendar-container text-body1">
        <full-calendar ref="cal" :options="calendarOptions">
          <template #eventContent="{ timeText, event }">
            <i
              v-if="event.extendedProps.table === 'rearings'"
              :style="`background-color: ${event.backgroundColor}`"
              :class="event.extendedProps.icon"
            ></i>
            <i v-else :class="event.extendedProps.icon"></i>
            {{ timeText }}
            {{ event.title }}
          </template>
        </full-calendar>
      </div>
      <dialog-hint :hint="`calendarHint`" v-model="showInfo"></dialog-hint>
      <calendar-setting v-model="showSetting"></calendar-setting>
    </div>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import _ from 'lodash';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';
import { onKeyStroke } from '@vueuse/core';
import dayjs from 'dayjs';
import { ref, watch, reactive, computed, onMounted } from 'vue';
import { useAuthUserStore } from '../stores/auth';
import { useCalendarStore } from '../stores/calendar';
import '@fullcalendar/core/vdom'; // solve problem with Vite
import FullCalendar, {
  CalendarOptions,
  DateSelectArg,
  EventClickArg,
  EventChangeArg,
  EventSourceInput,
} from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import allLocales from '@fullcalendar/core/locales-all';

import useCalendarVis from '../composables/useCalendarVis';
import { useNotification } from '../composables/useResponseText';
import { CALENDAR } from '../constants/';
import CalendarSetting from '../components/CalendarSetting.vue';
import DialogForm from 'src/components/DialogForm.vue';
import DialogHint from 'src/components/DialogHint.vue';
import DialogEvent from 'src/components/DialogEvent.vue';

const $q = useQuasar();
const notification = useNotification();
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
        todo: {
          date: dateClicked.value,
          name: '',
          note: '',
        },
      },
    })
    .onOk(() => {
      refetchSource('todos');
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
        const result = useCalendarVis(fetchInfo);
        successCallback(result);
      },
      id: source,
    });
  } else {
    eventsSourceList.push({
      events: function (fetchInfo, successCallback, failureCallback) {
        api.get(`/v1/calendar/${source}`, { params: fetchInfo }).then(
          (response: any) => {
            successCallback(response.data);
          },
          (error) => {
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

const calendarOptions = reactive({
  eventSources: eventsSourceActive,
  plugins: [dayGridPlugin, listPlugin, interactionPlugin],
  customButtons: {
    sources: {
      text: 'Settings',
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
  selectLongPressDelay: 10,
  firstDay: 1,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: 8,
  weekends: true,
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventChange: handleEventsChange,
} as CalendarOptions);

watch(storeCalendar, (currentValue) => {
  const calendarApi = cal.value.getApi();
  const addSources = _.difference(
    currentValue.calendar,
    eventsSourceActiveWatcher
  );
  const removeSources = _.difference(
    eventsSourceActiveWatcher,
    currentValue.calendar
  );
  eventsSourceActiveWatcher = currentValue.calendar;
  eventsSourceList.map(function (source: any) {
    if (addSources.includes(source.id)) {
      eventsSourceActive.push(source);
      _.remove(eventsSourceInactive, { id: source.id });
      calendarApi.addEventSource(source);
    } else if (removeSources.includes(source.id)) {
      eventsSourceInactive.push(source);
      _.remove(eventsSourceActive, { id: source.id });
      calendarApi.getEventSourceById(source.id).remove();
    }
  });
});

const refetchSource = (event: string) => {
  const calendarApi = cal.value.getApi();
  const source = calendarApi.getEventSourceById(event);
  source.refetch();
};

onKeyStroke('ArrowLeft', (e) => {
  e.preventDefault();
  cal.value.getApi().prev();
});
onKeyStroke('ArrowRight', (e) => {
  e.preventDefault();
  cal.value.getApi().next();
});

function onResize(_size: any) {
  cal.value.getApi().updateSize();
}

async function handleEventsChange(changeInfo: EventChangeArg) {
  // Single Day Events no Enddate possible
  if (
    changeInfo.event.extendedProps.table === 'todos' ||
    changeInfo.event.extendedProps.table === 'movedates'
  ) {
    if (changeInfo.event.end) {
      changeInfo.revert();
      return;
    }
  }

  let ids = '';
  let start = '';
  if (changeInfo.event.extendedProps.table === 'rearings') {
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
      _.map(changeInfo.event.extendedProps.steps, function (value) {
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
  const sourceName = changeInfo.event.extendedProps.table.slice(
    0,
    -1
  ) as string;
  await api.patch(`/v1/${sourceName}/date`, data).then(
    (_response: any) => {
      notification.open('positive', '');
      return true;
    },
    (error) => {
      notification.open('negative', error);
      changeInfo.revert();
    }
  );
}
function handleDateSelect(selectInfo: DateSelectArg) {
  if ($q.platform.is.mobile) {
    dateClicked.value = dayjs(selectInfo.start).format('YYYY-MM-DD');
    formDialog();
  } else if (
    dateClicked.value === dayjs(selectInfo.start).format('YYYY-MM-DD')
  ) {
    formDialog();
  }
  dateClicked.value = dayjs(selectInfo.start).format('YYYY-MM-DD');
}
function handleEventClick(clickInfo: EventClickArg) {
  clickInfo.jsEvent.preventDefault(); // don't let the browser navigate

  const event = {
    ..._.merge(
      clickInfo.event._instance?.range,
      clickInfo.event._def,
      clickInfo.event.extendedProps
    ),
  };
  eventDialog(event);
}
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
