import dayjs from 'dayjs';
import { intersection } from 'lodash';
import { MySQLServer } from '@servers/mysql.server';
import { Todo } from '@models/todo.model';
import { Rearing } from '@models/rearing/rearing.model';
import { RearingStep } from '@models/rearing/rearing_step.model';

const convertDate = ({ start, end }) => {
  return {
    start: dayjs(start).toISOString(),
    end: dayjs(end).toISOString()
  };
};

const getRearings = async ({ query, user }) => {
  // Because Rearings could goes over multiple months we add / substract here to catch them
  const start = dayjs(query.start).subtract(2, 'month').toISOString();
  const end = dayjs(query.end).add(2, 'month').toISOString();

  /*
   * Fetching Rearings and corresponding steps
   */
  const rearings: any = await Rearing.query()
    .where('rearings.user_id', user.user_id)
    .where('date', '>=', start)
    .where('date', '<=', end)
    .withGraphFetched('start')
    .withGraphFetched('type');
  const rearingsSteps = [];
  for (const i in rearings) {
    const res = rearings[i];
    const steps: any = await RearingStep.query()
      .where('type_id', res.type_id)
      .withGraphFetched('detail')
      .orderBy('position', 'asc');
    res.steps = { ...steps };
    for (const j in steps) {
      if (steps[j].detail_id === res.start.id)
        res.startPosition = steps[j].position;
    }
    rearingsSteps.push(res);
  }
  console.log(rearingsSteps);
  /*
   * Create ordered calendar events from starting step
   */
  const results = [];
  for (const i in rearingsSteps) {
    // addDate is helper for steps after selected step
    let addDate = dayjs(rearingsSteps[i].date);
    for (const j in rearingsSteps[i].steps) {
      const result = { ...rearingsSteps[i] };
      result.currentStep = { ...result.steps[j] };
      if (result.startPosition === result.currentStep.position) {
        console.log('test');
        // Current Step is actual Start Step
        result.start = dayjs(result.date).format('YYYY-MM-DD HH:00:00');
      } else {
        if (result.currentStep.position > result.startPosition) {
          // Step comes behind Start Step, we can simply add up the hours
          addDate = addDate.add(result.currentStep.detail.hour, 'hour');
          result.start = addDate.format('YYYY-MM-DD HH:00:00');
        } else {
          // Step comes before Start Step, this is more complicated as
          // we need to account for the steps which are coming before it
          const steps_before =
            result.startPosition - result.currentStep.position;
          // subDate is helper to calculate the date
          let subDate = dayjs(result.date);
          for (let k = 0; k < steps_before; k++) {
            subDate = subDate.subtract(result.steps[k].detail.hour, 'hour');
          }
          result.start = subDate.format('YYYY-MM-DD HH:00:00');
        }
      }
      result.title = `${result.currentStep.detail.job} ID: ${result.id}`;
      result.table = 'rearings';
      result.allDay = false;
      result.icon = 'venus';
      result.color = '#f5dfef';
      result.textColor = 'black';
      result.end = result.start;
      result.groupId = `Q${result.id}`;
      result.durationEditable = false;
      result.displayEventTime = true;
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
    .withGraphJoined('editor')
    .withGraphJoined('creator');
  let result = [];
  for (const i in results) {
    const res = results[i];
    res.allDay = true;
    res.task_ids = res.id;

    res.start = dayjs(res.date).format('YYYY-MM-DD');
    res.title = res.name;
    res.icon = 'clipboard-list';
    if (res.done === 1) {
      res.color = 'green';
    } else {
      res.color = 'red';
    }
    res.table = 'todos';
    if (res.editor) {
      res.editors = res.editor.email;
    } else {
      res.editors = '';
    }
    if (res.creator) {
      res.editors = res.creator.email;
    } else {
      res.creators = '';
    }
    result.push(res);
  }
  return result;
};

const getMovements = async ({ query, user }) => {
  const { start, end } = convertDate(query);
  const results = await MySQLServer.knex(`calendar_movements`)
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
    res.icon = 'truck-fast';
    res.color = 'gray';
    res.table = 'movedates';
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
  const results = await MySQLServer.knex(`calendar_${task}`)
    .where('user_id', user.user_id)
    .where('date', '>=', start)
    .where('enddate', '<=', end);
  let result = [];
  for (const i in results) {
    const res = results[i];
    res.id = task;
    res.allDay = true;
    res.start = dayjs(res.date).format('YYYY-MM-DD');
    // https://stackoverflow.com/a/54035812/5316675
    const count = (res.hive_names.match(/,/g) || []).length + 1;
    if (count === 1) {
      res.title = `[${res.hive_names}] ${res.type_name} - ${res.apiary_name}`;
    } else {
      res.title = `${count}x ${res.type_name} - ${res.apiary_name}`;
    }
    if (task === 'checkups') {
      res.icon = 'search';
      res.color = '#067558';
    } else if (task === 'treatments') {
      res.icon = 'plus';
      res.color = '#cc5b9a';
      res.title += ` (${res.disease_name})`;
    } else if (task === 'feeds') {
      res.icon = 'cube';
      res.color = '#d55e00';
    } else if (task === 'harvests') {
      res.icon = 'tint';
      res.color = 'yellow';
      res.textColor = 'black';
    }
    if (res.done === 0) res.color = 'red';
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

export { getTask, getMovements, getTodos, getRearings };
