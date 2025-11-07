import type { UseSwipeDirection } from '@vueuse/core';
import type { QNotifyUpdateOptions } from 'quasar';
import type { Ref } from 'vue';
import { useSwipe } from '@vueuse/core';
import { computed } from 'vue';
import { useNotification } from './useNotification';

export function useSwipeCalendar(cal: Ref<any | null>, container: Ref<HTMLElement | null>, opacity: Ref<number>, eventDrag: Ref<boolean>) {
	const notification = useNotification();
	let notificationDismiss: null | ((props?: QNotifyUpdateOptions) => void)
		= null;
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

	const { lengthX } = useSwipe(cal, {
		onSwipe() {
			onEventStart(lengthX.value, containerWidth.value);
		},
		onSwipeEnd(_e: TouchEvent, direction: UseSwipeDirection) {
			onEventEnd(lengthX.value, containerWidth.value, direction);
		},
	});

	function onEventStart(distance: number, container: number) {
		if (container && !eventDrag.value) {
			const ratio = Math.abs(distance) / container;
			if (ratio > 0.2) {
				opacity.value = 0.8 - ratio;
			}
			else {
				opacity.value = 1;
			}
		}
	}

	function onEventEnd(
		distance: number,
		container: number,
		direction: UseSwipeDirection,
	) {
		const ratio = Math.abs(distance) / container;
		if (container && !eventDrag.value && ratio >= 0.4) {
			if (cal.value.getApi()) {
				if (typeof notificationDismiss === 'function')
					notificationDismiss();
				if (direction === 'right') {
					cal.value.getApi().prev();
					notificationDismiss = notification.open(
						'info',
						cal.value.calendar.currentData.viewTitle,
						true,
					);
				}
				else {
					cal.value.getApi().next();
					notificationDismiss = notification.open(
						'info',
						cal.value.calendar.currentData.viewTitle,
						true,
					);
				}
			}
		}
		opacity.value = 1;
	}
}
