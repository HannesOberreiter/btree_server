import type { EventApi, EventInput } from '@fullcalendar/vue3';
import type { CalendarResponse } from '../api/types';
import dayjs from 'dayjs';

export function toCalendarEvent(event: CalendarResponse[number]): EventInput {
  const { id, textColor, ...input } = event;
  return {
    ...input,
    ...(id !== undefined ? { id: String(id) } : {}),
    ...(textColor !== undefined ? { contrastColor: textColor } : {})
  };
}

export function toCalendarDialogEvent(event: EventApi) {
  return {
    ...event.toPlainObject({ collapseExtendedProps: true }),
    publicId: event.id,
    start: event.startStr,
    // DialogEvent expects an exclusive end even for single-day events.
    end:
      event.endStr ||
      dayjs(event.startStr)
        .add(1, event.allDay ? 'day' : 'hour')
        .format()
  };
}
