import { MaybeRef } from '@vueuse/core';
import dayjs from 'dayjs';
import { includes, isNil, omitBy } from 'lodash-es';
import { Ref } from 'vue';
import {
  FormCharge,
  FormHive,
  FormOption,
  FormQueen,
  FormQuicktool,
  FormRearing,
  FormRearingDetail,
  FormRearingType,
  FormScale,
  FormScaleData,
  FormTodo,
} from '~/types';

export const useFormCleanup = (
  table: MaybeRef<string>,
  state: Ref,
  isEdit: boolean
) => {
  function cleanup() {
    if (unref(table) === 'hive') {
      return cleanupHive(state.value, isEdit);
    } else if (unref(table) === 'todo') {
      return cleanupTodo(state.value, isEdit);
    } else if (
      ['feed', 'checkup', 'treatment', 'harvest'].includes(unref(table))
    ) {
      return cleanupQuicktool(state.value, isEdit, unref(table));
    } else if (unref(table) === 'movedate') {
      return cleanupMovement(state.value, isEdit);
    } else if (unref(table) === 'queen') {
      return cleanupQueen(state.value, isEdit);
    } else if (unref(table) === 'apiary') {
      return cleanupApiary(state.value);
    } else if (unref(table) === 'charge') {
      return cleanupCharge(state.value);
    } else if (unref(table) === 'scale_data') {
      return cleanupScaleData(state.value);
    } else if (unref(table) === 'scale') {
      return cleanupScale(state.value);
    } else if (unref(table) === 'option') {
      return cleanupOption(state.value);
    } else if (unref(table) === 'rearing_detail') {
      return cleanupRearingDetail(state.value);
    } else if (unref(table) === 'rearing_type') {
      return cleanupRearingType(state.value);
    } else if (unref(table) === 'rearing') {
      return cleanupRearing(state.value);
    }
  }

  return {
    cleanup,
  };
};

function cleanupHive(state: FormHive, isEdit: boolean) {
  const result = {
    name: state.name,
    position: state.position,
    grouphive: state.grouphive,
    note: state.note,
    modus: state.modus,
    modus_date: state.modusDate,
    type_id: state.type ? state.type.id : null,
    source_id: state.source ? state.source.id : null,
  } as any;
  if (!isEdit) {
    result['start'] = state.start;
    result['repeat'] = state.repeat;
    result['apiary_id'] = state.apiary ? state.apiary.id : null;
    result['date'] = state.date;
  }
  return omitBy(result, isNil);
}

function cleanupQuicktool(state: FormQuicktool, isEdit: boolean, task: string) {
  const result = {
    date: state.date,
    enddate: state.enddate,
    type_id: state.type ? state.type.id : null,
    url: state.url,
    note: state.note,
    done: state.done,
  } as any;

  if (!isEdit) {
    result['hive_ids'] = state.hive.map((obj: any) => obj.id);
    result['interval'] = state.interval ? state.interval : 0;
    result['repeat'] = state.repeat ? state.repeat : 0;
  }

  if (task === 'checkup') {
    result['strong'] = state.checkup_strong;
    result['varroa'] = state.checkup_varroa;
    result['weight'] = state.checkup_weight_amount;
    result['time'] = state.checkup_weight_time
      ? dayjs(state.checkup_weight_time, 'HH:mm').format('HH:mm:ss')
      : null;
    result['temperature'] = state.checkup_temperature;
    result['broodframes'] = state.checkup_frames.broodframes;
    result['emptyframes'] = state.checkup_frames.emptyframes;
    result['foundation'] = state.checkup_frames.foundation;
    result['honeyframes'] = state.checkup_frames.honeyframes;

    result['brood'] = state.checkup_rating.brood;
    result['calm_comb'] = state.checkup_rating.calm_comb;
    result['comb'] = state.checkup_rating.comb;
    result['pollen'] = state.checkup_rating.pollen;
    result['swarm'] = state.checkup_rating.swarm;
    result['temper'] = state.checkup_rating.temper;
    if (state.checkup_queen[0]) {
      result['queen'] = includes(state.checkup_queen, 'queen');
      result['queencells'] = includes(state.checkup_queen, 'queencells');
      result['eggs'] = includes(state.checkup_queen, 'eggs');
      result['capped_brood'] = includes(state.checkup_queen, 'capped_brood');
    }
  } else {
    result['amount'] = state.amount_calc;

    if (task === 'treatment') {
      result['disease_id'] = state.treatment_disease
        ? state.treatment_disease.id
        : null;

      result['vet_id'] = state.treatment_vet ? state.treatment_vet.id : null;
      result['wait'] = state.treatment_wait;
      result['temperature'] = state.treatment_temperature;
    } else if (task === 'harvest') {
      result['frames'] = state.harvest_amount_calc;
      result['water'] = state.harvest_water;
      result['charge'] = state.harvest_charge;
    }
  }
  return omitBy(result, isNil);
}

function cleanupMovement(state: any, isEdit: boolean) {
  const result = {
    date: state.date,
    apiary_id: state.apiary ? state.apiary.id : null,
  } as any;
  if (!isEdit) {
    result['hive_ids'] = state.hive.map((obj: any) => obj.id);
  }
  return omitBy(result, isNil);
}

function cleanupQueen(state: FormQueen, isEdit: boolean) {
  const result = {
    name: state.name,
    mark_colour: state.mark_colour,
    date: state.date,
    move_date: state.move_date,
    mother: state.mother,

    hive_id: state.hive
      ? state.hive.length !== undefined
        ? state.hive.map((o: any) => o.id)
        : state.hive.id
      : null,
    mother_id: !state.mother_id
      ? null
      : 'id' in state.mother_id
      ? state.mother_id.id
      : 'label' in state.mother_id
      ? 'undefined' // Workaround if no mother is given
      : null,
    race_id: state.race ? state.race.id : null,
    mating_id: state.mating ? state.mating.id : null,
    url: state.url,
    note: state.note,
    modus: state.modus,
    modus_date: state.modusDate,
  } as any;
  if (!isEdit) {
    result['start'] = state.start;
    result['repeat'] = state.repeat;
  }
  const res = omitBy(result, isNil);
  // workaround if "no mother" is given
  if ('mother_id' in res) {
    if (res.mother_id === 'undefined') {
      res.mother_id = null;
    }
  }
  return res;
}

function cleanupApiary(state: any) {
  const result = {
    ...state,
  } as any;
  return omitBy(result, isNil);
}

function cleanupTodo(state: FormTodo, isEdit: boolean) {
  const result = {
    date: state.date,
    done: state.done,
    name: state.name,
    note: state.note,
    url: state.url,
  } as any;

  if (!isEdit) {
    result['interval'] = state.interval;
    result['repeat'] = state.repeat;
  }
  return omitBy(result, isNil);
}

function cleanupCharge(state: FormCharge) {
  const result = {
    name: state.name,
    price: state.price,
    amount: state.amount,
    charge: state.charge,
    url: state.url,
    note: state.note,
    date: state.date,
    bestbefore: state.bestbefore,
    kind: state.kind,
    type_id: state.type ? state.type.id : null,
  } as any;
  return omitBy(result, isNil);
}

function cleanupScaleData(state: FormScaleData) {
  const result = {
    weight: state.weight,
    temp1: state.temp1,
    temp2: state.temp2,
    humidity: state.humidity,
    rain: state.rain,
    note: state.note,
    datetime: new Date(state.datetime).toISOString(),
    scale_id: state.scale ? state.scale.id : null,
  } as any;
  return omitBy(result, isNil);
}

function cleanupScale(state: FormScale) {
  const result = {
    name: state.name,
    hive_id: state.hive ? state.hive.id : null,
  } as any;
  return omitBy(result, isNil);
}

function cleanupOption(state: FormOption) {
  const result = {
    name: state.name,
    note: state.note,
    unit: state.unit,
    favorite: state.favorite,
    modus: state.modus,
  } as any;
  return omitBy(result, isNil);
}

function cleanupRearingDetail(state: FormRearingDetail) {
  return omitBy(state, isNil);
}

function cleanupRearing(state: FormRearing) {
  const result = {
    name: state.name,
    symbol: state.symbol,
    date: state.date ? new Date(state.date + ':00').toISOString() : null,
    hatch: state.hatch,
    larvae: state.larvae,
    mated: state.mated,
    note: state.note,
    type_id: state.type ? state.type.id : null,
    detail_id: state.detail ? state.detail.value : null,
  } as any;
  return omitBy(result, isNil);
}

function cleanupRearingType(state: FormRearingType) {
  return omitBy(state, isNil);
}
