import type { CalendarApi } from '@fullcalendar/vue3';
import type { UseSwipeDirection } from '@vueuse/core';
import type { QNotifyUpdateOptions } from 'quasar';
import type { Ref } from 'vue';
import { useSwipe } from '@vueuse/core';
import { computed } from 'vue';
import { useNotification } from './useNotification';

interface CalendarSwipeTarget {
  getApi: () => CalendarApi;
}

export function useSwipeCalendar(
  cal: Ref<CalendarSwipeTarget | null>,
  container: Ref<HTMLElement | null>,
  opacity: Ref<number>,
  eventDrag: Ref<boolean>
) {
  const notification = useNotification();
  let notificationDismiss: null | ((props?: QNotifyUpdateOptions) => void) =
    null;
  const containerWidth = computed(() => container.value?.offsetWidth || 0);

  /* const { distanceX } = usePointerSwipe(cal, {
    threshold: 50,
    pointerTypes: ['mouse'],
    onSwipe(_e: PointerEvent) {
      onEventStart(distanceX.value, containerWidth.value);
    },
    onSwipeEnd(_e: PointerEvent, direction: SwipeDirection) {
      onEventEnd(distanceX.value, containerWidth.value, direction);
    },
  }); */

  const { lengthX } = useSwipe(container, {
    onSwipe() {
      onEventStart(lengthX.value, containerWidth.value);
    },
    onSwipeEnd(_e: TouchEvent, direction: UseSwipeDirection) {
      onEventEnd(lengthX.value, containerWidth.value, direction);
    }
  });

  function onEventStart(distance: number, container: number) {
    if (container && !eventDrag.value) {
      const ratio = Math.abs(distance) / container;
      if (ratio > 0.2) {
        opacity.value = 0.8 - ratio;
      } else {
        opacity.value = 1;
      }
    }
  }

  function onEventEnd(
    distance: number,
    container: number,
    direction: UseSwipeDirection
  ) {
    const ratio = Math.abs(distance) / container;
    if (container && !eventDrag.value && ratio >= 0.4) {
      const calendar = cal.value;
      const calendarApi = calendar?.getApi();
      if (calendarApi && calendar) {
        if (typeof notificationDismiss === 'function') {
          notificationDismiss();
        }
        if (direction === 'right') {
          calendarApi.prev();
          notificationDismiss = notification.open(
            'info',
            calendarApi.view.title,
            true
          );
        } else {
          calendarApi.next();
          notificationDismiss = notification.open(
            'info',
            calendarApi.view.title,
            true
          );
        }
      }
    }
    opacity.value = 1;
  }
}
