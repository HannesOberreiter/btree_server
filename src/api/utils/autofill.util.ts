import type { Database } from '../../types/database.types.js';

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
    apiary: { name: 'Sample Apiary', latitude: 47.074853, longitude: 12.69527 },
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
} as const;

export async function autoFill(
  db: Database,
  companyId: number,
  language: string,
) {
  const values = standardValues[language === 'de' ? 'de' : 'en'];
  for (const name of values.source)
    await db
      .insertInto('hive_sources')
      .values({ name, user_id: companyId })
      .execute();
  for (const name of values.type)
    await db
      .insertInto('hive_types')
      .values({ name, user_id: companyId })
      .execute();
  for (const name of values.charge)
    await db
      .insertInto('charge_types')
      .values({ name, user_id: companyId })
      .execute();
  for (const name of values.checkup)
    await db
      .insertInto('checkup_types')
      .values({ name, user_id: companyId })
      .execute();
  for (const name of values.feed)
    await db
      .insertInto('feed_types')
      .values({ name, user_id: companyId })
      .execute();
  for (const name of values.harvest)
    await db
      .insertInto('harvest_types')
      .values({ name, user_id: companyId })
      .execute();
  for (const name of values.disease)
    await db
      .insertInto('treatment_diseases')
      .values({ name, user_id: companyId })
      .execute();
  for (const name of values.treatment)
    await db
      .insertInto('treatment_types')
      .values({ name, user_id: companyId })
      .execute();
  for (const name of values.vet)
    await db
      .insertInto('treatment_vets')
      .values({ name, user_id: companyId })
      .execute();
  for (const name of values.race)
    await db
      .insertInto('queen_races')
      .values({ name, user_id: companyId })
      .execute();
  for (const name of values.mating)
    await db
      .insertInto('queen_matings')
      .values({ name, user_id: companyId })
      .execute();

  const typeInsert = await db
    .insertInto('rearing_types')
    .values({
      name: values.reartype.name,
      note: values.reartype.note,
      user_id: companyId,
    })
    .executeTakeFirstOrThrow();
  const typeId = Number(typeInsert.insertId);
  for (let index = 0; index < values.reardetail.job.length; index++) {
    const detailInsert = await db
      .insertInto('rearing_details')
      .values({
        job: values.reardetail.job[index],
        note: values.reardetail.note[index],
        user_id: companyId,
      })
      .executeTakeFirstOrThrow();
    await db
      .insertInto('rearing_steps')
      .values({
        position: index,
        type_id: typeId,
        detail_id: Number(detailInsert.insertId),
        sleep_before: values.reardetail.time[index],
      })
      .execute();
  }
  await db
    .insertInto('apiaries')
    .values({
      name: values.apiary.name,
      longitude: values.apiary.longitude,
      latitude: values.apiary.latitude,
      user_id: companyId,
    })
    .execute();
}
