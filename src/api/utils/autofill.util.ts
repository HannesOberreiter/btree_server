import type { Transaction } from 'objection';
import { Apiary } from '../models/apiary.model.js';
import { ChargeType } from '../models/option/charge_type.model.js';
import { CheckupType } from '../models/option/checkup_type.model.js';
import { FeedType } from '../models/option/feed_type.model.js';
import { HarvestType } from '../models/option/harvest_type.model.js';
import { HiveSource } from '../models/option/hive_source.model.js';
import { HiveType } from '../models/option/hive_type.mode.js';
import { QueenMating } from '../models/option/queen_mating.model.js';
import { QueenRace } from '../models/option/queen_race.model.js';
import { TreatmentDisease } from '../models/option/treatment_disease.model.js';
import { TreatmentType } from '../models/option/treatment_type.model.js';
import { TreatmentVet } from '../models/option/treatment_vet.model.js';
import { RearingDetail } from '../models/rearing/rearing_detail.model.js';
import { RearingStep } from '../models/rearing/rearing_step.model.js';
import { RearingType } from '../models/rearing/rearing_type.model.js';

const standardValues = {
  de: {
    apiary: {
      name: 'Muster Bienenstand',
      latitude: 47.074853,
      longitude: 12.69527,
    },
    source: ['Ableger', 'Gekauft', 'Kunstschwarm', 'Schwarm'],
    type: [
      'Aktiv',
      'Zucht',
      'Verkauft',
      'Vereinigt - Schwach',
      'Aufgelöst - Verhungert',
      'Aufgelöst - Unbekannt',
    ],
    checkup: [
      'Kontrolle',
      'Zargenwechsel',
      'Schied +',
      'Schied -',
      'Varroakontrolle',
      'Drohnenrahmen +',
      'Drohnenrahmen -',
    ],
    charge: ['Futter - Zucker', 'kg', 'Material - Zargen', 'Stk.'],
    feed: ['3:2 Zuckerwasser', '1:1 Zuckerwasser', 'Futterteig'],
    harvest: ['Mischhonig', 'Raps', 'Akazien', 'Waldhonig'],
    disease: [
      'amerikanische Faulbrut',
      'Schimmel-Pilze',
      'Ruhr',
      'Kalkbrut',
      'Varroa',
    ],
    treatment: [
      'Wabenentnahme',
      'Ableger',
      'Abschwefeln',
      'Ameisensäure',
      'Oxalsäure (Sublimieren)',
    ],
    vet: ['-'],
    race: ['Linie A', 'Unbekannt', 'A.m.Mellifera'],
    mating: ['Belegstelle', 'Standbegattung', 'Künstliche Besamung'],
    reartype: {
      name: 'Starter Finisher',
      note: 'Weiselloses Volk, ohne offene Brut zum aufziehen der Weiselzellen.',
    },
    reardetail: {
      job: [
        'Sammelableger',
        'Weiselzellen brechen',
        'Umlarven',
        'Finisher',
        'Käfigen',
        'Schlupf',
      ],
      note: [
        'Erstellen des Sammelablegers mit verdeckelte Brutwaben, aufsitzenden Bienen von offener Brut und Pollen und Futterwaben.',
        'Weiselzellen suchen und wenn vorhanden brechen.',
        'Maximal einen Tag alte verwenden! (Anm. 3 Tage Ei Stadium).',
        'Angeblasene Zellen einem weiselrichtigen Wirtschaftsvolk über einem Absperrgitter einhängen.',
        'Schlupfkäfig über Weiselzellen anbringen.',
        'Königinnen schlüpfen (12 Tage nach dem Umlarven).',
      ],
      time: [0, 219, 3, 48, 120, 120],
    },
  },
  en: {
    apiary: {
      name: 'Sample Apiary',
      latitude: 47.074853,
      longitude: 12.69527,
    },
    source: ['Artifical Swarm', 'Split', 'Swarm'],
    type: [
      'Active',
      'Rearing',
      'Sold',
      'Combined - Weak',
      'Lost - Queen Problem',
      'Lost - Varroa',
      'Lost - Unknown',
    ],
    checkup: [
      'Checkup',
      'Varroa Control',
      'Pressing +',
      'Pressing -',
      'Droneframe +',
      'Droneframe -',
    ],
    charge: ['Feed-Sugar', 'kg', 'Production-Glasses', 'Pcs.'],
    feed: ['3:2 Sugarwater', '1:1 Sugarwater', 'Sugarfond'],
    harvest: ['Mix Honey', 'Rapeseed', 'Acacia', 'Honeydew'],
    disease: ['AFB', 'Mold Fungi', 'Dysentery', 'Chalk Brood', 'Varroa'],
    treatment: [
      'Comb Removal',
      'Split',
      'Sulphurizing',
      'Formic Acid',
      'Oxalic Strips',
    ],
    vet: ['-'],
    race: ['LineA', 'Unknown', 'A.m.Mellifera'],
    mating: ['Mating Place', 'Home Apiary', 'Artificial Insemination'],
    reartype: {
      name: 'Starter Finisher',
      note: 'Starter to get the queencells ready and finish in normal hive with queen.',
    },
    reardetail: {
      job: [
        'Starter',
        'Break Queenscells',
        'Grafting',
        'Finisher',
        'Cage Queencells',
        'Queens emerge',
      ],
      note: [
        'Create a queenless hive with capped brood, bees, food and pollen frames.',
        'Search and break queen cells if there are any.',
        'Fill the grafting frame, use max. 1 day old larvae (Egg needs 3 days to larvae).',
        'Move the grafting frame to a strong hive with a queen.',
        'Cage the queens cells.',
        'Queen emerges (12 days after grafting (if you use 1 day old larvae)).',
      ],
      time: [0, 219, 3, 48, 120, 120],
    },
  },
};

async function autoFill(trx: Transaction, id: number, lang: string) {
  const val = standardValues[lang];

  // We use MySQL we cannot use patch insert
  for (const source of val.source) {
    await HiveSource.query(trx).insert({ name: source, user_id: id });
  }
  for (const type of val.type) {
    await HiveType.query(trx).insert({ name: type, user_id: id });
  }
  for (const charge of val.charge) {
    await ChargeType.query(trx).insert({ name: charge, user_id: id });
  }
  for (const checkup of val.checkup) {
    await CheckupType.query(trx).insert({ name: checkup, user_id: id });
  }
  for (const feed of val.feed) {
    await FeedType.query(trx).insert({ name: feed, user_id: id });
  }
  for (const harvest of val.harvest) {
    await HarvestType.query(trx).insert({ name: harvest, user_id: id });
  }
  for (const disease of val.disease) {
    await TreatmentDisease.query(trx).insert({ name: disease, user_id: id });
  }
  for (const treatment of val.treatment) {
    await TreatmentType.query(trx).insert({ name: treatment, user_id: id });
  }
  for (const vet of val.vet) {
    await TreatmentVet.query(trx).insert({ name: vet, user_id: id });
  }
  for (const race of val.race) {
    await QueenRace.query(trx).insert({ name: race, user_id: id });
  }
  for (const mating of val.mating) {
    await QueenMating.query(trx).insert({ name: mating, user_id: id });
  }

  // Rearing we need to get always the last inserted id
  const rearType = await RearingType.query(trx).insert({
    name: val.reartype.name,
    note: val.reartype.note,
    user_id: id,
  });
  for (let i = 0; i < val.reardetail.job.length; i++) {
    const rearingDetail = await RearingDetail.query(trx).insert({
      job: val.reardetail.job[i],
      note: val.reardetail.note[i],
      user_id: id,
    });
    await RearingStep.query(trx).insert({
      position: i,
      type_id: rearType.id,
      detail_id: rearingDetail.id,
      sleep_before: val.reardetail.time[i],
    });
  }

  await Apiary.query(trx).insert({
    name: val.apiary.name,
    longitude: val.apiary.longitude,
    latitude: val.apiary.latitude,
    user_id: id,
  });
}

export { autoFill };
