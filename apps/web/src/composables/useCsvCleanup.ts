import { MaybeRef } from '@vueuse/core';
import dayjs from 'dayjs';
import { Ref } from 'vue';

export const useCsvCleanup = (table: MaybeRef<string>, state: Ref) => {
  function cleanup() {
    if (unref(table) === 'checkup') {
      return cleanupCheckup(state.value);
    } else if (unref(table) === 'treatment') {
      return cleanupTreatment(state.value);
    } else if (unref(table) === 'harvest') {
      return cleanupHarvest(state.value);
    } else if (unref(table) === 'feed') {
      return cleanupFeed(state.value);
    }
  }
  return {
    cleanup,
  };
};

function getField(field: any, state: any) {
  let value = null;
  if (field.name in state) {
    value = state[field.name];
    if (field.type === 'int') {
      value = parseInt(value);
    } else if (field.type === 'number') {
      value = parseFloat(value);
    } else if (field.type === 'date') {
      value = dayjs(value).format('YYYY-MM-DD');
    } else if (field.type === 'boolean') {
      value = parseInt(value) === 1;
    }
  } else {
    if (field.type === 'int') {
      value = 1;
    } else if (field.type === 'number') {
      value = 0;
    } else if (field.type === 'date') {
      value = dayjs().format('YYYY-MM-DD');
    } else if (field.type === 'boolean') {
      value = true;
    }
  }
  if (field.name === 'note') {
    value = value ? value + ' ' + '[import csv]' : '[import csv]';
  }
  return value;
}

function hiveIds(state: any) {
  if ('hive_id' in state) {
    return [parseInt(state['hive_id'])];
  }
  return null;
}

function cleanupCheckup(state: any) {
  const result = {
    repeat: 0,
    interval: 0,
    hive_ids: hiveIds(state),
  } as any;
  const fields = [
    {
      name: 'date',
      type: 'date',
    },
    {
      name: 'enddate',
      type: 'date',
    },
    {
      name: 'url',
      type: 'string',
    },
    {
      name: 'note',
      type: 'string',
    },
    {
      name: 'done',
      type: 'boolean',
    },
    {
      name: 'type_id',
      type: 'int',
    },
    {
      name: 'queen',
      type: 'boolean',
    },
    {
      name: 'queencells',
      type: 'boolean',
    },
    {
      name: 'eggs',
      type: 'boolean',
    },
    {
      name: 'capped_brood',
      type: 'boolean',
    },
    {
      name: 'brood',
      type: 'int',
    },
    {
      name: 'pollen',
      type: 'int',
    },
    {
      name: 'comb',
      type: 'int',
    },
    {
      name: 'temper',
      type: 'int',
    },
    {
      name: 'calm_comb',
      type: 'int',
    },
    {
      name: 'swarm',
      type: 'int',
    },
    {
      name: 'varroa',
      type: 'int',
    },
    {
      name: 'strong',
      type: 'int',
    },
    {
      name: 'temp',
      type: 'number',
    },
    {
      name: 'weight',
      type: 'number',
    },
    {
      name: 'time',
      type: 'string',
    },
    {
      name: 'broodframes',
      type: 'int',
    },
    {
      name: 'honeyframes',
      type: 'int',
    },
    {
      name: 'foundation',
      type: 'int',
    },
    {
      name: 'emptyframes',
      type: 'int',
    },
  ];
  fields.forEach((field) => {
    const res = getField(field, state);
    if (res) return (result[field.name] = res);
  });
  return result;
}

function cleanupTreatment(state: any) {
  const result = {
    repeat: 0,
    interval: 0,
    hive_ids: hiveIds(state),
  } as any;
  const fields = [
    {
      name: 'date',
      type: 'date',
    },
    {
      name: 'enddate',
      type: 'date',
    },
    {
      name: 'url',
      type: 'string',
    },
    {
      name: 'note',
      type: 'string',
    },
    {
      name: 'done',
      type: 'boolean',
    },
    {
      name: 'type_id',
      type: 'int',
    },
    {
      name: 'disease_id',
      type: 'int',
    },
    {
      name: 'vet_id',
      type: 'int',
    },
    {
      name: 'wait',
      type: 'int',
    },
    {
      name: 'amount',
      type: 'number',
    },
  ];
  fields.forEach((field) => {
    const res = getField(field, state);
    if (res) return (result[field.name] = res);
  });
  return result;
}

function cleanupHarvest(state: any) {
  const result = {
    repeat: 0,
    interval: 0,
    hive_ids: hiveIds(state),
  } as any;
  const fields = [
    {
      name: 'date',
      type: 'date',
    },
    {
      name: 'enddate',
      type: 'date',
    },
    {
      name: 'url',
      type: 'string',
    },
    {
      name: 'note',
      type: 'string',
    },
    {
      name: 'done',
      type: 'boolean',
    },
    {
      name: 'type_id',
      type: 'int',
    },
    {
      name: 'charge',
      type: 'string',
    },
    {
      name: 'water',
      type: 'number',
    },
    {
      name: 'frames',
      type: 'number',
    },
    {
      name: 'amount',
      type: 'number',
    },
  ];
  fields.forEach((field) => {
    const res = getField(field, state);
    if (res) return (result[field.name] = res);
  });
  return result;
}

function cleanupFeed(state: any) {
  const result = {
    repeat: 0,
    interval: 0,
    hive_ids: hiveIds(state),
  } as any;
  const fields = [
    {
      name: 'date',
      type: 'date',
    },
    {
      name: 'enddate',
      type: 'date',
    },
    {
      name: 'url',
      type: 'string',
    },
    {
      name: 'note',
      type: 'string',
    },
    {
      name: 'done',
      type: 'boolean',
    },
    {
      name: 'type_id',
      type: 'int',
    },
    {
      name: 'amount',
      type: 'number',
    },
  ];
  fields.forEach((field) => {
    const res = getField(field, state);
    if (res) return (result[field.name] = res);
  });
  return result;
}
