import dayjs from 'dayjs';
import { sql } from 'kysely';
import { intersection, round } from 'lodash-es';

import type { Database } from '../../types/database.types.js';
import type {
  CalendarRangeQuery,
  CalendarRearingQuery,
} from '../schemas/calendar.schema.js';

const COMMA_REGEX = /,/g;

type CalendarTask = 'checkup' | 'treatment' | 'harvest' | 'feed';
type CalendarTaskTable =
  | 'calendar_checkups'
  | 'calendar_treatments'
  | 'calendar_harvests'
  | 'calendar_feeds';

const taskTables: Record<CalendarTask, CalendarTaskTable> = {
  checkup: 'calendar_checkups',
  treatment: 'calendar_treatments',
  harvest: 'calendar_harvests',
  feed: 'calendar_feeds',
};

function dateRange(params: CalendarRangeQuery) {
  return { start: new Date(params.start), end: new Date(params.end) };
}

function uniqueIdentifiers(value: string | null) {
  return value ? String(intersection(value.split(','))) : '';
}

function calendarTitleCount(hiveNames: string | null) {
  return ((hiveNames ?? '').match(COMMA_REGEX) || []).length + 1;
}

interface RearingDetail {
  id: number;
  job: string | null;
  hour: number | null;
  note: string | null;
  user_id: number | null;
}

interface RearingType {
  id: number;
  name: string | null;
  note: string | null;
  user_id: number | null;
}

interface RearingStep {
  id: number;
  type_id: number | null;
  detail_id: number | null;
  position: number | null;
  sleep_after: number | null;
  sleep_before: number | null;
  detail: RearingDetail | null;
}

function rearingDetailProjection() {
  return sql<RearingDetail | null>`
    CASE WHEN rearing_details.id IS NOT NULL THEN JSON_OBJECT(
      'id', rearing_details.id,
      'job', rearing_details.job,
      'hour', rearing_details.hour,
      'note', rearing_details.note,
      'user_id', rearing_details.user_id
    ) ELSE NULL END
  `.as('start_detail');
}

function rearingTypeProjection() {
  return sql<RearingType | null>`
    CASE WHEN rearing_types.id IS NOT NULL THEN JSON_OBJECT(
      'id', rearing_types.id,
      'name', rearing_types.name,
      'note', rearing_types.note,
      'user_id', rearing_types.user_id
    ) ELSE NULL END
  `.as('type');
}

function stepDetailProjection() {
  return sql<RearingDetail | null>`
    CASE WHEN rearing_details.id IS NOT NULL THEN JSON_OBJECT(
      'id', rearing_details.id,
      'job', rearing_details.job,
      'hour', rearing_details.hour,
      'note', rearing_details.note,
      'user_id', rearing_details.user_id
    ) ELSE NULL END
  `.as('detail');
}

export async function listCalendarRearings(
  db: Database,
  companyId: number,
  params: CalendarRearingQuery,
) {
  let query = db
    .selectFrom('rearings')
    .leftJoin('rearing_details', 'rearing_details.id', 'rearings.detail_id')
    .leftJoin('rearing_types', 'rearing_types.id', 'rearings.type_id')
    .selectAll('rearings')
    .select([rearingDetailProjection(), rearingTypeProjection()])
    .where('rearings.user_id', '=', companyId);

  if (params.id !== undefined) {
    query = query.where('rearings.id', '=', params.id);
  } else if (params.start && params.end) {
    query = query
      .where(
        'rearings.date',
        '>=',
        dayjs(params.start).subtract(2, 'month').toDate(),
      )
      .where('rearings.date', '<=', dayjs(params.end).add(2, 'month').toDate());
  }

  const rearings = await query.execute();
  const typeIds = [
    ...new Set(
      rearings
        .map((rearing) => rearing.type_id)
        .filter((id): id is number => id !== null),
    ),
  ];
  const stepRows =
    typeIds.length === 0
      ? []
      : await db
          .selectFrom('rearing_steps')
          .leftJoin(
            'rearing_details',
            'rearing_details.id',
            'rearing_steps.detail_id',
          )
          .selectAll('rearing_steps')
          .select(stepDetailProjection())
          .where('rearing_steps.type_id', 'in', typeIds)
          .orderBy('rearing_steps.position', 'asc')
          .execute();

  const stepsByType = new Map<number, RearingStep[]>();
  for (const step of stepRows) {
    if (step.type_id === null) continue;
    const steps = stepsByType.get(step.type_id) ?? [];
    steps.push(step);
    stepsByType.set(step.type_id, steps);
  }

  return rearings.flatMap((rearing) => {
    const steps =
      rearing.type_id === null ? [] : (stepsByType.get(rearing.type_id) ?? []);
    const startKey = steps.findIndex(
      (step) => step.detail_id === rearing.start_detail?.id,
    );
    if (startKey < 0 || rearing.date === null) return [];

    const startPosition = steps[startKey].position;
    const dates: string[] = [];
    let addDate = dayjs(rearing.date);
    steps.forEach((step, index) => {
      let date: dayjs.Dayjs;
      if (index === startKey) {
        date = dayjs(rearing.date);
      } else if (index > startKey) {
        addDate = addDate.add(step.sleep_before ?? 0, 'hour');
        date = addDate;
      } else {
        date = dayjs(rearing.date);
        for (let offset = 0; offset < startKey - index; offset++) {
          date = date.subtract(
            steps[startKey - offset].sleep_before ?? 0,
            'hour',
          );
        }
      }
      dates[index] = date.toISOString();
    });

    const calendarSteps = Object.fromEntries(
      steps.map((step, index) => [
        index,
        Object.assign({}, step, { key: String(index), date: dates[index] }),
      ]),
    );

    const events = [];
    for (const [index, step] of steps.entries()) {
      const start = dates[index];
      const currentStep = Object.assign({}, step, {
        key: String(index),
        date: start,
      });
      const { start_detail: _startDetail, ...rearingFields } = rearing;
      events.push({
        ...rearingFields,
        startPosition,
        startKey: String(startKey),
        steps: calendarSteps,
        currentStep,
        start,
        title: `${step.detail?.job} ID: ${rearing.name || rearing.id}`,
        table: 'rearing',
        allDay: false,
        icon: `fas fa-${rearing.symbol || 'venus'}`,
        color: '#f5dfef',
        textColor: 'black',
        end: dayjs(start).add(1, 'second').toISOString(),
        groupId: `Q${rearing.id}`,
        displayEventTime: true,
        durationEditable: false,
      });
    }
    return events;
  });
}

export async function listCalendarTodos(
  db: Database,
  companyId: number,
  params: CalendarRangeQuery,
) {
  const { start, end } = dateRange(params);
  const rows = await db
    .selectFrom('todos')
    .leftJoin('apiaries', 'apiaries.id', 'todos.apiary_id')
    .leftJoin('bees as creators', 'creators.id', 'todos.bee_id')
    .leftJoin('bees as editors', 'editors.id', 'todos.edit_id')
    .selectAll('todos')
    .select([
      'apiaries.name as apiary_name',
      sql<{ email: string | null; username: string | null } | null>`
        CASE WHEN creators.id IS NOT NULL THEN JSON_OBJECT(
          'email', creators.email,
          'username', creators.username
        ) ELSE NULL END
      `.as('creator'),
      sql<{ email: string | null; username: string | null } | null>`
        CASE WHEN editors.id IS NOT NULL THEN JSON_OBJECT(
          'email', editors.email,
          'username', editors.username
        ) ELSE NULL END
      `.as('editor'),
    ])
    .where('todos.user_id', '=', companyId)
    .where('todos.date', '>=', start)
    .where('todos.date', '<=', end)
    .where((expression) =>
      expression.or([
        expression('todos.apiary_id', 'is', null),
        expression('apiaries.deleted', '=', false),
      ]),
    )
    .execute();

  return rows.flatMap((row) => {
    if (row.date === null) return [];
    return [
      {
        ...row,
        allDay: true,
        task_ids: row.id,
        description: row.note,
        start: dayjs(row.date).format('YYYY-MM-DD'),
        title: row.apiary_name
          ? `[${row.apiary_name}] ${row.name}`
          : (row.name ?? ''),
        icon: 'fas fa-clipboard',
        durationEditable: false,
        unicode: row.done ? '✏️ ✅' : '✏️ ❎',
        color: row.done ? 'green' : 'red',
        table: 'todo',
        editors: row.editor?.username ?? row.editor?.email ?? '',
        creators: row.creator?.username ?? row.creator?.email ?? '',
      },
    ];
  });
}

export async function listCalendarMovements(
  db: Database,
  companyId: number,
  params: CalendarRangeQuery,
) {
  const { start, end } = dateRange(params);
  const rows = await db
    .selectFrom('calendar_movements')
    .selectAll()
    .where('user_id', '=', companyId)
    .where('date', '>=', dayjs(start).format('YYYY-MM-DD HH:mm:ss'))
    .where('date', '<=', dayjs(end).format('YYYY-MM-DD HH:mm:ss'))
    .execute();

  return rows.flatMap((row) => {
    if (row.date === null) return [];
    const count = calendarTitleCount(row.hive_names);
    return [
      {
        ...row,
        allDay: true,
        task_ids: row.move_ids,
        start: dayjs(row.date).format('YYYY-MM-DD'),
        title:
          count === 1
            ? `[${row.hive_names}] - ${row.apiary_name}`
            : `${count}x ${row.apiary_name}`,
        icon: 'fas fa-truck',
        unicode: '🚚',
        color: 'gray',
        table: 'movedate',
        description: row.hive_names,
        durationEditable: false,
        editors: uniqueIdentifiers(row.editors),
        creators: uniqueIdentifiers(row.creators),
      },
    ];
  });
}

export async function listCalendarTasks(
  db: Database,
  companyId: number,
  params: CalendarRangeQuery,
  task: CalendarTask,
) {
  const { start, end } = dateRange(params);
  const rows = await db
    .selectFrom(taskTables[task])
    .selectAll()
    .where('user_id', '=', companyId)
    .where('date', '>=', start)
    .where('enddate', '<=', end)
    .execute();

  return rows.flatMap((row) => {
    if (row.date === null || row.enddate === null) return [];
    const count = calendarTitleCount(row.hive_names);
    let title =
      count === 1
        ? `[${row.hive_names}] ${row.type_name} - ${row.apiary_name}`
        : `${count}x ${row.type_name} - ${row.apiary_name}`;
    let icon = '';
    let color = '';
    let textColor: string | undefined;
    if (task === 'checkup') {
      icon = 'fas fa-search';
      color = '#067558';
    } else if (task === 'treatment') {
      icon = 'fas fa-plus';
      color = '#cc5b9a';
      title += ` (${row.disease_name})`;
    } else if (task === 'feed') {
      icon = 'fas fa-cube';
      color = '#d55e00';
    } else {
      icon = 'fas fa-tint';
      color = 'yellow';
      textColor = 'black';
    }
    if (!row.done) {
      color = 'red';
      textColor = 'white';
    }

    return [
      {
        ...row,
        id: task,
        description: row.hive_names,
        allDay: true,
        start: dayjs(row.date).format('YYYY-MM-DD'),
        title,
        icon,
        color,
        ...(textColor && { textColor }),
        unicode: row.done ? '✅' : '❎',
        table: task,
        editors: uniqueIdentifiers(row.editors),
        creators: uniqueIdentifiers(row.creators),
        end: dayjs(row.enddate).add(1, 'day').format('YYYY-MM-DD'),
      },
    ];
  });
}

export async function listCalendarScaleData(
  db: Database,
  companyId: number,
  params: CalendarRangeQuery,
) {
  const { start, end } = dateRange(params);
  const rows = await db
    .selectFrom('calendar_scale_data')
    .selectAll()
    .where('user_id', '=', companyId)
    .where('date', '>=', dayjs(start).format('YYYY-MM-DD HH:mm:ss'))
    .where('date', '<=', dayjs(end).format('YYYY-MM-DD HH:mm:ss'))
    .execute();

  let previousWeight = 0;
  return rows.flatMap((row) => {
    if (row.date === null) return [];
    const average = Number(row.average ?? 0);
    const difference = round(average - previousWeight, 1);
    previousWeight = average;
    const increase = difference > 0;
    return [
      {
        ...row,
        id: row.name,
        allDay: true,
        start: dayjs(row.date).format('YYYY-MM-DD'),
        end: dayjs(row.date).add(1, 'day').format('YYYY-MM-DD'),
        difference,
        description: difference,
        title: `${increase ? '(+)' : '(-)'} ${row.average} ${row.name}`,
        icon: increase ? 'fas fa-plus' : 'fas fa-minus',
        color: increase ? 'green' : 'red',
        textColor: 'white',
        editable: false,
      },
    ];
  });
}

export type { CalendarTask };
