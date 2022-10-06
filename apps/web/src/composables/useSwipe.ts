import type { SwipeDirection } from '@vueuse/core';
import { useSwipe } from '@vueuse/core';
import { Ref } from 'vue';

export const useSwipeCalendar = (
  cal: Ref<any | null>,
  container: Ref<HTMLElement | null>
) => {
  const containerWidth = computed(() => container.value?.offsetWidth);
  const { lengthX } = useSwipe(cal, {
    onSwipeEnd(_e: TouchEvent, direction: SwipeDirection) {
      if (
        containerWidth.value &&
        Math.abs(lengthX.value) / containerWidth.value >= 0.5
      ) {
        if (cal.value.getApi()) {
          if (direction === 'RIGHT') {
            cal.value.getApi().prev();
          } else {
            cal.value.getApi().next();
          }
        }
      }
    },
  });
};
