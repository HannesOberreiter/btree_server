<template>
  <div width="100%">
    <q-resize-observer @resize="onResize" />
    <div class="col-12">
      <div class="calendar-container text-body1">
        <full-calendar ref="cal" :options="calendarOptions"> </full-calendar>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core';
import { useAuthUserStore } from '~/stores/auth';
import { useNotification } from '~/composables/useNotification';
import '@fullcalendar/core/vdom'; // solve problem with Vite
import FullCalendar, {
  CalendarOptions,
  EventClickArg,
} from '@fullcalendar/vue3';
import allLocales from '@fullcalendar/core/locales-all';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useCalendarQuery } from '~/composables/useQuery';

const useQuery = useCalendarQuery();
const { t } = useI18n();
const notification = useNotification();
const storeUser = useAuthUserStore();
const { getUser } = storeToRefs(storeUser);

const cal = ref();

onMounted(() => {
  onKeyStroke('ArrowLeft', (e) => {
    e.preventDefault();
    if (cal.value.getApi()) cal.value.getApi().prev();
  });
  onKeyStroke('ArrowRight', (e) => {
    e.preventDefault();
    if (cal.value.getApi()) cal.value.getApi().next();
  });
});

function onResize(_size: any) {
  cal.value.getApi().updateSize();
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
  weekNumbers: true,
  weekNumberCalculation: 'ISO',
  displayEventTime: true,
  firstDay: 1,
  selectable: false, // Allows a user to highlight multiple days or timeslots by clicking and dragging.
  dayMaxEvents: 8,
  weekends: true,
  eventClick: handleEventClick,
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
