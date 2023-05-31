import dayjs from 'dayjs';
import { intersection, round } from 'lodash';
import { DatabaseServer } from '@/servers/db.server';
import { Todo } from '@models/todo.model';
import { Rearing } from '@models/rearing/rearing.model';
import { RearingStep } from '@models/rearing/rearing_step.model';

const convertDate = ({ start, end }) => {
  return {
    start: dayjs(start).toISOString().slice(0, 19).replace('T', ' '),
    end: dayjs(end).toISOString().slice(0, 19).replace('T', ' '),
  };
};

const getRearings = async ({ query, user }) => {
  /*
   * Fetching Rearings and corresponding steps
   */
  const rearings_query = Rearing.query()
    .where('rearings.user_id', user.user_id)
    .withGraphFetched('[start, type]');

  if (query.id) {
    // if not used inside calendar and we only want one event
    rearings_query.where('id', query.id);
  } else {
    // Because Rearings could goes over multiple months we add / substract here to catch them
    const start = dayjs(query.start).subtract(2, 'month').toISOString();
    const end = dayjs(query.end).add(2, 'month').toISOString();
    rearings_query.where('date', '>=', start).where('date', '<=', end);
  }

  const rearings = await rearings_query;
  const rearingsSteps = [];
  for (const i in rearings) {
    const res = rearings[i] as any;
    const steps = await RearingStep.query()
      .where('type_id', res.type_id)
      .withGraphFetched('detail')
      .orderBy('position', 'asc');

    for (const j in steps) {
      steps[j]['key'] = j;
      if (steps[j].detail_id === res.start.id) {
        res.startPosition = steps[j].position;
        res.startKey = j;
      }
    }
    res.steps = { ...steps };
    rearingsSteps.push(res);
  }
  /*
   * Create ordered calendar events from starting step
   */
  const results = [];
  for (const i in rearingsSteps) {
    // addDate is helper for steps after selected step
    let addDate = dayjs(rearingsSteps[i].date);
    for (const j in rearingsSteps[i].steps) {
      const result = { ...rearingsSteps[i] };
      result.steps = rearingsSteps[i].steps;
      result.currentStep = { ...result.steps[j] };
      if (result.startPosition === result.currentStep.position) {
        // Current Step is actual Start Step
        result.start = dayjs(result.date).toISOString();
      } else {
        if (
          parseInt(result.currentStep.position) > parseInt(result.startPosition)
        ) {
          // Step comes behind Start Step, we can simply add up the hours
          addDate = addDate.add(result.currentStep.detail.hour, 'hour');
          result.start = addDate.toISOString();
        } else {
          // Step comes before Start Step, this is more complicated as
          // we need to account for the steps which are coming before it
          const steps_before = result.startKey - result.currentStep.key;
          // subDate is helper to calculate the date
          let subDate = dayjs(result.date);
          for (let k = 0; k < steps_before; k++) {
            subDate = subDate.subtract(
              result.steps[result.startKey - k].detail.hour,
              'hour'
            );
          }
          result.start = subDate.toISOString();
        }
      }
      result.steps[j].date = result.start;
      result.currentStep.date = result.start;

      result.title = `${result.currentStep.detail.job} ID: ${
        result.name ? result.name : result.id
      }`;
      result.table = 'rearing';
      result.allDay = false;
      result.icon = `fas fa-${result.symbol ? result.symbol : 'venus'}`;
      result.color = '#f5dfef';
      result.textColor = 'black';
      result.end = dayjs(result.start).add(1, 'second').toISOString();
      result.groupId = `Q${result.id}`;
      result.displayEventTime = true;
      result.durationEditable = false;

      results.push(result);
    }
  }
  return results;
};

const getTodos = async ({ query, user }) => {
  const { start, end } = convertDate(query);

  const results: any = await Todo.query()
    .where('user_id', user.user_id)
    .where('date', '>=', start)
    .where('date', '<=', end)
    .withGraphJoined('[creator(identifier), editor(identifier)]');
  let result = [];
  for (const i in results) {
    const res = results[i];
    res.allDay = true;
    res.task_ids = res.id;
    res.description = res.note;
    res.start = dayjs(res.date).format('YYYY-MM-DD');
    res.title = res.name;
    res.icon = 'fas fa-clipboard';
    res.durationEditable = false;
    if (res.done) {
      res.unicode = '✏️ ✅';
      res.color = 'green';
    } else {
      res.unicode = '✏️ ❎';
      res.color = 'red';
    }
    res.table = 'todo';
    if (res.editor) {
      res.editors = res.editor.username
        ? res.editor.username
        : res.editor.email;
    } else {
      res.editors = '';
    }
    if (res.creator) {
      res.creators = res.creator.username
        ? res.creator.username
        : res.creator.email;
    } else {
      res.creators = '';
    }

    result.push(res);
  }
  return result;
};

const getMovements = async ({ query, user }) => {
  const { start, end } = convertDate(query);
  const results = await DatabaseServer.knex(`calendar_movements`)
    .where('user_id', user.user_id)
    .where('date', '>=', start)
    .where('date', '<=', end);
  let result = [];
  for (const i in results) {
    const res = results[i];
    res.allDay = true;
    res.task_ids = res.move_ids;

    res.start = dayjs(res.date).format('YYYY-MM-DD');
    const count = (res.hive_names.match(/,/g) || []).length + 1;
    if (count === 1) {
      res.title = `[${res.hive_names}] - ${res.apiary_name}`;
    } else {
      res.title = `${count}x ${res.apiary_name}`;
    }
    res.icon = 'fas fa-truck';
    res.unicode = '🚚';
    res.color = 'gray';
    res.table = 'movedate';
    res.description = res.hive_names;
    res.durationEditable = false;
    if (res.editors) {
      res.editors = String(intersection(res.editors.split(',')));
    } else {
      res.editors = '';
    }
    if (res.creators) {
      res.creators = String(intersection(res.creators.split(',')));
    } else {
      res.creators = '';
    }
    result.push(res);
  }
  return result;
};

const getTask = async ({ query, user }, task: string) => {
  const { start, end } = convertDate(query);
  const results = await DatabaseServer.knex(`calendar_${task}s`)
    .where('user_id', user.user_id)
    .where('date', '>=', start)
    .where('enddate', '<=', end);
  let result = [];
  for (const i in results) {
    const res = results[i];
    res.id = task;
    res.description = res.hive_names;
    res.allDay = true;
    res.start = dayjs(res.date).format('YYYY-MM-DD');
    // https://stackoverflow.com/a/54035812/5316675
    const count = (res.hive_names.match(/,/g) || []).length + 1;
    if (count === 1) {
      res.title = `[${res.hive_names}] ${res.type_name} - ${res.apiary_name}`;
    } else {
      res.title = `${count}x ${res.type_name} - ${res.apiary_name}`;
    }
    if (task === 'checkup') {
      res.icon = 'fas fa-search';
      res.color = '#067558';
    } else if (task === 'treatment') {
      res.icon = 'fas fa-plus';
      res.color = '#cc5b9a';
      res.title += ` (${res.disease_name})`;
    } else if (task === 'feed') {
      res.icon = 'fas fa-cube';
      res.color = '#d55e00';
    } else if (task === 'harvest') {
      res.icon = 'fas fa-tint';
      res.color = 'yellow';
      res.textColor = 'black';
    }
    res.unicode = '✅';
    if (!res.done) {
      res.unicode = '❎';
      res.color = 'red';
      res.textColor = 'white';
    }
    res.table = task;
    if (res.editors) {
      res.editors = String(intersection(res.editors.split(',')));
    } else {
      res.editors = '';
    }
    if (res.creators) {
      res.creators = String(intersection(res.creators.split(',')));
    } else {
      res.creators = '';
    }
    // Event end Date is exclusive see docu https://fullcalendar.io/docs/event_data/Event_Object/
    res.end = dayjs(res.enddate).add(1, 'day').format('YYYY-MM-DD');
    result.push(res);
  }
  return result;
};

const getScaleData = async ({ query, user }) => {
  const { start, end } = convertDate(query);

  const results = await DatabaseServer.knex(`calendar_scale_data`)
    .where('user_id', user.user_id)
    .where('date', '>=', start)
    .where('date', '<=', end);
  let result = [];
  let weight_last = 0;
  for (const i in results) {
    const res = results[i];
    res.id = res.name;
    res.allDay = true;
    // Event end Date is exclusive see docu https://fullcalendar.io/docs/event_data/Event_Object/
    res.start = dayjs(res.date).format('YYYY-MM-DD');
    res.end = dayjs(res.date).add(1, 'day').format('YYYY-MM-DD');
    res.difference = round(res.average - weight_last, 1);
    res.description = res.difference;
    weight_last = res.average;
    const weight_addon = res.difference > 0 ? '(+)' : '(-)';
    res.title = `${weight_addon} ${res.average} ${res.name}`;
    res.icon = res.difference > 0 ? `fas fa-plus` : 'fas fa-minus';
    res.color = res.difference > 0 ? 'green' : 'red';
    res.textColor = 'white';
    res.editable = false;
    result.push(res);
  }
  return result;
};

export { getTask, getMovements, getTodos, getRearings, getScaleData };
