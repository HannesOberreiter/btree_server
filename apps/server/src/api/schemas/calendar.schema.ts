import { z } from 'zod';

export const calendarRangeQuerySchema = z.object({
  start: z.string(),
  end: z.string(),
});

export const calendarRearingQuerySchema = z
  .object({
    start: z.string().optional(),
    end: z.string().optional(),
    id: z.number().optional(),
  })
  .refine((value) => Boolean((value.start && value.end) || value.id));

export const calendarEventResponseSchema = z.looseObject({
  id: z.union([z.string(), z.number()]).optional(),
  title: z.string(),
  start: z.string(),
  end: z.string().optional(),
  allDay: z.boolean(),
  table: z.string().optional(),
  description: z.union([z.string(), z.number()]).nullable().optional(),
  color: z.string().optional(),
  textColor: z.string().optional(),
  icon: z.string().optional(),
  unicode: z.string().optional(),
  editable: z.boolean().optional(),
  durationEditable: z.boolean().optional(),
  displayEventTime: z.boolean().optional(),
  creators: z.string().optional(),
  editors: z.string().optional(),
  task_ids: z.union([z.string(), z.number()]).optional(),
  name: z.string().nullable().optional(),
  symbol: z.string().optional(),
});

export const calendarResponseSchema = z.array(calendarEventResponseSchema);

export type CalendarRangeQuery = z.infer<typeof calendarRangeQuerySchema>;
export type CalendarRearingQuery = z.infer<typeof calendarRearingQuerySchema>;
