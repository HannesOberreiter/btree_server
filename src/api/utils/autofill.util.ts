import { Transaction } from 'objection';
import { CheckupType } from '@models/option/checkup_type.model';
import { Apiary } from '../models/apiary.model';
import { HiveSource } from '../models/option/hive_source.model';
import { HiveType } from '../models/option/hive_type.mode';
import { ChargeType } from '../models/option/charge_type.model';
import { FeedType } from '../models/option/feed_type.model';
import { HarvestType } from '../models/option/harvest_type.model';
import { TreatmentDisease } from '../models/option/treatment_disease.model';
import { TreatmentType } from '../models/option/treatment_type.model';
import { TreatmentVet } from '../models/option/treatment_vet.model';

const standardValues = {
  de: {
    apiary: {
      name: 'Muster Bienenstand',
      latitude: 47.074853,
      longitude: 12.69527
    },
    source: ['Kunstschwarm', 'Ableger', 'Schwarm'],
    type: ['Zander', 'Langstroth', 'Dadant'],
    checkup: ['Kontrolle', 'Zargenwechsel'],
    charge: ['Zucker', 'kg', 'Zargen', 'Stk.'],
    feed: ['3:2 Zuckerwasser', '1:1 Zuckerwasser', 'Futterteig'],
    harvest: ['Mischhonig', 'Raps', 'Akazien', 'Waldhonig'],
    disease: [
      'amerikanische Faulbrut',
      'Schimmel-Pilze',
      'Ruhr',
      'Kalkbrut',
      'Varroa'
    ],
    treatment: ['Wabenentnahme', 'Ableger', 'Abschwefeln', 'Ameisensäure'],
    vet: ['-'],
    race: ['A.m.Carnica', 'A.m.Ligustica', 'A.m.Mellifera'],
    mating: ['Belegstelle', 'Standbegattung', 'Künstliche Besamung'],
    rearmethod: {
      name: 'Starter Finisher',
      note: 'Weiselloses Volk, ohne offene Brut zum aufziehen der Weiselzellen.'
    },
    reardetail: {
      job: [
        'Sammelableger',
        'Weiselzellen brechen',
        'Umlarven',
        'Finisher',
        'Käfigen',
        'Schlupf'
      ],
      note: [
        'Erstellen des Sammelablegers mit verdeckelte Brutwaben, aufsitzenden Bienen von offener Brut und Pollen und Futterwaben.',
        'Weiselzellen suchen und wenn vorhanden brechen.',
        'Maximal einen Tag alte verwenden! (Anm. 3 Tage Ei Stadium).',
        'Angeblasene Zellen einem weiselrichtigen Wirtschaftsvolk über einem Absperrgitter einhängen.',
        'Schlupfkäfig über Weiselzellen anbringen.',
        'Königinnen schlüpfen (12 Tage nach dem Umlarven).'
      ],
      time: [0, 219, 3, 48, 120, 120]
    }
  }
};

const autoFill = async (trx: Transaction, id: number, lang: string) => {
  const val = standardValues[lang];
  
  // We use MySQL we cannot use patch insert
  for(let source of val.source){
   await HiveSource.query(trx).insert({name: source, user_id: id});
  }
  for(let type of val.type){
   await HiveType.query(trx).insert({name: type, user_id: id});
  }
  for(let charge of val.charge){
   await ChargeType.query(trx).insert({name: charge, user_id: id});
  }
  for(let checkup of val.checkup){
   await CheckupType.query(trx).insert({name: checkup, user_id: id});
  }
  for(let feed of val.feed){
   await FeedType.query(trx).insert({name: feed, user_id: id});
  }
  for(let harvest of val.harvest){
   await HarvestType.query(trx).insert({name: harvest, user_id: id});
  }
  for(let disease of val.disease){
   await TreatmentDisease.query(trx).insert({name: disease, user_id: id});
  }
  for(let treatment of val.treatment){
   await TreatmentType.query(trx).insert({name: treatment, user_id: id});
  }
  for(let vet of val.vet){
   await TreatmentVet.query(trx).insert({name: vet, user_id: id});
  }
  // TODO Race, Rearing

  await Apiary.query(trx).insert({
    name: val.apiary.name, longitude: val.apiary.longitude, latitude: val.apiary.latitude, user_id: id
  });
  

  return;
};

export { autoFill };
