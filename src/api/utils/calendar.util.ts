import dayjs from 'dayjs';
import { intersection } from 'lodash';
import { MySQLServer } from '@servers/mysql.server';

const convertDate = ({ start, end }) => {
  return {
    start: dayjs(start).toISOString(),
    end: dayjs(end).toISOString()
  };
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
      res.color = 'green';
    } else if (task === 'treatments') {
      res.icon = 'plus';
      res.color = 'violet';
      res.title += ` (${res.disease_name})`;
    } else if (task === 'feeds') {
      res.icon = 'cube';
      res.color = 'orange';
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

export { getTask, getMovements };
