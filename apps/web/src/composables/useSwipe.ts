import { SwipeDirection, useSwipe } from '@vueuse/core';
import { QNotifyUpdateOptions } from 'quasar';
import { Ref } from 'vue';
import { useNotification } from './useNotification';

export const useSwipeCalendar = (
  cal: Ref<any | null>,
  container: Ref<HTMLElement | null>,
  opacity: Ref<number>,
  eventDrag: Ref<boolean>
) => {
  const notification = useNotification();
  let notificationDismiss: null | ((props?: QNotifyUpdateOptions) => void) =
    null;
  const containerWidth = computed(() => container.value?.offsetWidth);

  /*const { distanceX } = usePointerSwipe(cal, {
    threshold: 50,
    pointerTypes: ['mouse'],
    onSwipe(_e: PointerEvent) {
      onEventStart(distanceX.value, containerWidth.value);
    },
    onSwipeEnd(_e: PointerEvent, direction: SwipeDirection) {
      onEventEnd(distanceX.value, containerWidth.value, direction);
    },
  });*/

  const { lengthX } = useSwipe(cal, {
    onSwipe() {
      onEventStart(lengthX.value, containerWidth.value);
    },
    onSwipeEnd(_e: TouchEvent, direction: SwipeDirection) {
      onEventEnd(lengthX.value, containerWidth.value, direction);
    },
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
    direction: SwipeDirection
  ) {
    const ratio = Math.abs(distance) / container;
    if (container && !eventDrag.value && ratio >= 0.4) {
      if (cal.value.getApi()) {
        if (typeof notificationDismiss === 'function') notificationDismiss();
        if (direction === 'RIGHT') {
          cal.value.getApi().prev();
          notificationDismiss = notification.open(
            'info',
            cal.value.calendar.currentData.viewTitle,
            true
          );
        } else {
          cal.value.getApi().next();
          notificationDismiss = notification.open(
            'info',
            cal.value.calendar.currentData.viewTitle,
            true
          );
        }
      }
    }
    opacity.value = 1;
  }
};
