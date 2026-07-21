import { Buffer } from 'node:buffer';

import type archiver from 'archiver';
import { parse } from 'csv-parse/sync';
import type { Options } from 'csv-stringify/sync';
import { stringify } from 'csv-stringify/sync';
import httpErrors from 'http-errors';
import type { Transaction } from 'kysely';
import { sql } from 'kysely';
import yauzl from 'yauzl-promise';

import type { Database } from '../../types/database.types.js';
import type { DB } from '../../types/db.types.js';

const NEWLINE_QUOTE_REGEX = /(\r\n|[\n\r"])/g;
const MAX_ARCHIVE_ENTRIES = 64;
const MAX_ARCHIVE_ENTRY_BYTES = 25 * 1024 * 1024;
const MAX_ARCHIVE_TOTAL_BYTES = 100 * 1024 * 1024;
type CsvRecord = Record<string, string | number | boolean | null | undefined>;
type TransferKey =
  | 'hives'
  | 'hive_types'
  | 'hive_sources'
  | 'apiaries'
  | 'movedates'
  | 'checkups'
  | 'checkup_types'
  | 'feeds'
  | 'feed_types'
  | 'treatments'
  | 'treatment_types'
  | 'treatment_diseases'
  | 'treatment_vets'
  | 'harvests'
  | 'harvest_types'
  | 'charges'
  | 'charge_types'
  | 'queens'
  | 'queen_matings'
  | 'queen_races'
  | 'todos';
type TransferData = Record<TransferKey, CsvRecord[]>;

const transferKeys: TransferKey[] = [
  'hives',
  'hive_types',
  'hive_sources',
  'apiaries',
  'movedates',
  'checkups',
  'checkup_types',
  'feeds',
  'feed_types',
  'treatments',
  'treatment_types',
  'treatment_diseases',
  'treatment_vets',
  'harvests',
  'harvest_types',
  'charges',
  'charge_types',
  'queens',
  'queen_matings',
  'queen_races',
  'todos',
];
const columns: Record<TransferKey, readonly string[]> = {
  apiaries: [
    'name',
    'latitude',
    'longitude',
    'description',
    'elevation',
    'note',
    'url',
    'modus',
    'deleted',
    'deleted_at',
    'created_at',
    'updated_at',
    'user_id',
  ],
  hives: [
    'name',
    'grouphive',
    'position',
    'note',
    'modus',
    'modus_date',
    'deleted',
    'deleted_at',
    'created_at',
    'updated_at',
    'user_id',
    'type_id',
    'source_id',
  ],
  hive_types: [
    'name',
    'modus',
    'favorite',
    'created_at',
    'updated_at',
    'user_id',
  ],
  hive_sources: [
    'name',
    'modus',
    'favorite',
    'created_at',
    'updated_at',
    'user_id',
  ],
  movedates: [
    'date',
    'note',
    'apiary_id',
    'hive_id',
    'created_at',
    'updated_at',
  ],
  checkups: [
    'date',
    'enddate',
    'time',
    'note',
    'url',
    'done',
    'deleted',
    'deleted_at',
    'brood',
    'broodframes',
    'capped_brood',
    'pollen',
    'comb',
    'temper',
    'temperature',
    'calm_comb',
    'swarm',
    'varroa',
    'strong',
    'eggs',
    'emptyframes',
    'foundation',
    'honeyframes',
    'queen',
    'queencells',
    'weight',
    'hive_id',
    'type_id',
    'user_id',
    'created_at',
    'updated_at',
  ],
  checkup_types: [
    'name',
    'modus',
    'favorite',
    'created_at',
    'updated_at',
    'user_id',
  ],
  feeds: [
    'date',
    'enddate',
    'note',
    'url',
    'done',
    'deleted',
    'deleted_at',
    'amount',
    'hive_id',
    'type_id',
    'user_id',
    'created_at',
    'updated_at',
  ],
  feed_types: [
    'name',
    'modus',
    'favorite',
    'created_at',
    'updated_at',
    'user_id',
  ],
  treatments: [
    'date',
    'enddate',
    'note',
    'url',
    'done',
    'deleted',
    'deleted_at',
    'amount',
    'temperature',
    'wait',
    'hive_id',
    'type_id',
    'disease_id',
    'vet_id',
    'user_id',
    'created_at',
    'updated_at',
  ],
  treatment_types: [
    'name',
    'modus',
    'favorite',
    'created_at',
    'updated_at',
    'user_id',
  ],
  treatment_diseases: [
    'name',
    'modus',
    'favorite',
    'created_at',
    'updated_at',
    'user_id',
  ],
  treatment_vets: [
    'name',
    'modus',
    'favorite',
    'created_at',
    'updated_at',
    'user_id',
  ],
  harvests: [
    'date',
    'enddate',
    'note',
    'url',
    'done',
    'deleted',
    'deleted_at',
    'amount',
    'frames',
    'water',
    'charge',
    'hive_id',
    'type_id',
    'user_id',
    'created_at',
    'updated_at',
  ],
  harvest_types: [
    'name',
    'modus',
    'favorite',
    'created_at',
    'updated_at',
    'user_id',
  ],
  charges: [
    'date',
    'bestbefore',
    'name',
    'charge',
    'calibrate',
    'amount',
    'price',
    'note',
    'url',
    'kind',
    'deleted',
    'deleted_at',
    'type_id',
    'user_id',
    'created_at',
    'updated_at',
  ],
  charge_types: [
    'name',
    'unit',
    'modus',
    'favorite',
    'created_at',
    'updated_at',
    'user_id',
  ],
  queens: [
    'name',
    'mark_colour',
    'mother',
    'date',
    'move_date',
    'url',
    'note',
    'modus',
    'modus_date',
    'deleted',
    'deleted_at',
    'hive_id',
    'race_id',
    'mating_id',
    'mother_id',
    'user_id',
    'created_at',
    'updated_at',
  ],
  queen_matings: [
    'name',
    'modus',
    'favorite',
    'created_at',
    'updated_at',
    'user_id',
  ],
  queen_races: [
    'name',
    'modus',
    'favorite',
    'created_at',
    'updated_at',
    'user_id',
  ],
  todos: [
    'name',
    'date',
    'note',
    'url',
    'done',
    'apiary_id',
    'user_id',
    'created_at',
    'updated_at',
  ],
};
const booleanFields = new Set([
  'modus',
  'favorite',
  'deleted',
  'done',
  'grouphive',
  'capped_brood',
  'eggs',
  'queen',
  'queencells',
]);

function parseCsv(csv: string): CsvRecord[] {
  return parse(csv, {
    columns: true,
    cast: false,
    to: 1_000_000,
    skipEmptyLines: true,
    onRecord(record: Record<string, string>, context) {
      if (context.header) return;
      const result: CsvRecord = {};
      for (const [key, value] of Object.entries(record)) {
        if (value === '') continue;
        result[key] = booleanFields.has(key) ? value === '1' : value;
      }
      return result;
    },
  });
}

function clean(key: TransferKey, record: CsvRecord, extra: CsvRecord = {}) {
  const result: CsvRecord = {};
  for (const column of columns[key]) {
    const value = Object.hasOwn(extra, column) ? extra[column] : record[column];
    if (value !== undefined && value !== null && typeof value !== 'object')
      result[column] = value;
  }
  return result;
}

async function insertRow(
  db: Transaction<DB>,
  table: TransferKey,
  record: CsvRecord,
) {
  const entries = Object.entries(record);
  if (!entries.length) throw new Error(`No values for ${table}`);
  const names = entries.map(([name]) => sql.ref(name));
  const values = entries.map(([, value]) => sql`${value}`);
  const result =
    await sql`INSERT INTO ${sql.table(table)} (${sql.join(names)}) VALUES (${sql.join(values)})`.execute(
      db,
    );
  return Number(result.insertId);
}
async function insertRows(
  db: Transaction<DB>,
  table: TransferKey,
  rows: CsvRecord[],
) {
  const ids: number[] = [];
  for (const row of rows) ids.push(await insertRow(db, table, row));
  return ids;
}
function idMap(oldRows: CsvRecord[], ids: number[]) {
  const result: Record<string, number> = {};
  oldRows.forEach((row, index) => {
    if (row.id !== undefined) result[String(row.id)] = ids[index];
  });
  return result;
}
function mapped(map: Record<string, number>, value: CsvRecord[string]) {
  return value === undefined || value === null
    ? null
    : (map[String(value)] ?? null);
}
async function optionRows(
  db: Transaction<DB>,
  key: TransferKey,
  rows: CsvRecord[],
  companyId: number,
) {
  const ids = await insertRows(
    db,
    key,
    rows.map((row) => clean(key, row, { user_id: companyId })),
  );
  return idMap(rows, ids);
}

export async function importCompanyArchive(
  db: Database,
  beeId: number,
  upload: Buffer,
) {
  const data = Object.fromEntries(
    transferKeys.map((key) => [key, []]),
  ) as TransferData;
  const zip = await yauzl.fromBuffer(upload);
  let entryCount = 0;
  let totalBytes = 0;
  try {
    for await (const entry of zip) {
      entryCount += 1;
      if (entryCount > MAX_ARCHIVE_ENTRIES) {
        throw httpErrors.PayloadTooLarge('Archive contains too many files');
      }

      const key = entry.filename.split('.')[0] as TransferKey;
      if (!transferKeys.includes(key)) continue;
      if (entry.uncompressedSize > MAX_ARCHIVE_ENTRY_BYTES) {
        throw httpErrors.PayloadTooLarge('Archive file is too large');
      }

      const stream = await entry.openReadStream();
      const chunks: Buffer[] = [];
      let entryBytes = 0;
      for await (const chunk of stream) {
        const buffer = Buffer.from(chunk);
        entryBytes += buffer.byteLength;
        totalBytes += buffer.byteLength;
        if (
          entryBytes > MAX_ARCHIVE_ENTRY_BYTES ||
          totalBytes > MAX_ARCHIVE_TOTAL_BYTES
        ) {
          throw httpErrors.PayloadTooLarge('Extracted archive is too large');
        }
        chunks.push(buffer);
      }
      data[key] = parseCsv(Buffer.concat(chunks).toString());
    }
  } finally {
    await zip.close();
  }
  if (!data.apiaries.length) throw new Error('No apiaries to move');
  if (!data.hives.length) throw new Error('No hives to move');
  if (!data.movedates.length) throw new Error('No moves to move');

  const name = `${Date.now()}`;
  const paid = new Date();
  paid.setDate(paid.getDate() + 4);
  await db.transaction().execute(async (trx) => {
    const companyInsert = await trx
      .insertInto('companies')
      .values({ name, paid })
      .executeTakeFirstOrThrow();
    const companyId = Number(companyInsert.insertId);
    await trx
      .insertInto('company_bee')
      .values({ bee_id: beeId, user_id: companyId })
      .execute();
    const apiaryIds = await insertRows(
      trx,
      'apiaries',
      data.apiaries.map((row) =>
        clean('apiaries', row, {
          user_id: companyId,
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
        }),
      ),
    );
    const apiaries = idMap(data.apiaries, apiaryIds);
    const hiveTypes = await optionRows(
      trx,
      'hive_types',
      data.hive_types,
      companyId,
    );
    const hiveSources = await optionRows(
      trx,
      'hive_sources',
      data.hive_sources,
      companyId,
    );
    const hiveIds = await insertRows(
      trx,
      'hives',
      data.hives.map((row) =>
        clean('hives', row, {
          user_id: companyId,
          type_id: mapped(hiveTypes, row.type_id),
          source_id: mapped(hiveSources, row.source_id),
        }),
      ),
    );
    const hives = idMap(data.hives, hiveIds);
    await insertRows(
      trx,
      'movedates',
      data.movedates.map((row) =>
        clean('movedates', row, {
          apiary_id: mapped(apiaries, row.apiary_id),
          hive_id: mapped(hives, row.hive_id),
        }),
      ),
    );

    const chargeTypes = await optionRows(
      trx,
      'charge_types',
      data.charge_types,
      companyId,
    );
    await insertRows(
      trx,
      'charges',
      data.charges.map((row) =>
        clean('charges', row, {
          user_id: companyId,
          type_id: mapped(chargeTypes, row.type_id),
        }),
      ),
    );
    await insertRows(
      trx,
      'todos',
      data.todos.map((row) =>
        clean('todos', row, {
          user_id: companyId,
          apiary_id: mapped(apiaries, row.apiary_id),
        }),
      ),
    );
    const treatmentTypes = await optionRows(
      trx,
      'treatment_types',
      data.treatment_types,
      companyId,
    );
    const diseases = await optionRows(
      trx,
      'treatment_diseases',
      data.treatment_diseases,
      companyId,
    );
    const vets = await optionRows(
      trx,
      'treatment_vets',
      data.treatment_vets,
      companyId,
    );
    await insertRows(
      trx,
      'treatments',
      data.treatments.map((row) =>
        clean('treatments', row, {
          user_id: companyId,
          hive_id: mapped(hives, row.hive_id),
          type_id: mapped(treatmentTypes, row.type_id),
          disease_id: mapped(diseases, row.disease_id),
          vet_id: mapped(vets, row.vet_id),
        }),
      ),
    );
    const harvestTypes = await optionRows(
      trx,
      'harvest_types',
      data.harvest_types,
      companyId,
    );
    await insertRows(
      trx,
      'harvests',
      data.harvests.map((row) =>
        clean('harvests', row, {
          user_id: companyId,
          hive_id: mapped(hives, row.hive_id),
          type_id: mapped(harvestTypes, row.type_id),
        }),
      ),
    );
    const feedTypes = await optionRows(
      trx,
      'feed_types',
      data.feed_types,
      companyId,
    );
    await insertRows(
      trx,
      'feeds',
      data.feeds.map((row) =>
        clean('feeds', row, {
          user_id: companyId,
          hive_id: mapped(hives, row.hive_id),
          type_id: mapped(feedTypes, row.type_id),
        }),
      ),
    );
    const checkupTypes = await optionRows(
      trx,
      'checkup_types',
      data.checkup_types,
      companyId,
    );
    await insertRows(
      trx,
      'checkups',
      data.checkups.map((row) =>
        clean('checkups', row, {
          user_id: companyId,
          hive_id: mapped(hives, row.hive_id),
          type_id: mapped(checkupTypes, row.type_id),
        }),
      ),
    );
    const races = await optionRows(
      trx,
      'queen_races',
      data.queen_races,
      companyId,
    );
    const matings = await optionRows(
      trx,
      'queen_matings',
      data.queen_matings,
      companyId,
    );
    await insertRows(
      trx,
      'queens',
      data.queens.map((row) =>
        clean('queens', row, {
          user_id: companyId,
          hive_id: mapped(hives, row.hive_id),
          race_id: mapped(races, row.race_id),
          mating_id: mapped(matings, row.mating_id),
          mother_id: null,
        }),
      ),
    );
  });
  return { name };
}

async function appendTable(
  db: Database,
  arch: archiver.Archiver,
  table: TransferKey,
  companyId: number,
  options: Options,
) {
  const rows = await db
    .selectFrom(table)
    .selectAll()
    .where('user_id', '=', companyId)
    .execute();
  arch.append(stringify(rows, options), { name: `${table}.csv` });
}
export async function downloadCompanyData(
  db: Database,
  arch: archiver.Archiver,
  companyId: number,
) {
  const options: Options = {
    header: true,
    cast: {
      date: (value) => value.toISOString(),
      string: (value) => value.replace(NEWLINE_QUOTE_REGEX, ' '),
      boolean: (value) => (value === null ? '' : value ? '1' : '0'),
    },
    record_delimiter: 'windows',
  };
  const company = await db
    .selectFrom('companies')
    .selectAll()
    .where('id', '=', companyId)
    .execute();
  arch.append(stringify(company, options), { name: 'company.csv' });
  for (const table of transferKeys.filter((key) => key !== 'movedates'))
    await appendTable(db, arch, table, companyId, options);
  const movedates = await db
    .selectFrom('movedates')
    .innerJoin('apiaries', 'apiaries.id', 'movedates.apiary_id')
    .selectAll('movedates')
    .where('apiaries.user_id', '=', companyId)
    .execute();
  arch.append(stringify(movedates, options), { name: 'movedates.csv' });
  const scales = await db
    .selectFrom('scales')
    .selectAll()
    .where('user_id', '=', companyId)
    .execute();
  arch.append(stringify(scales, options), { name: 'scales.csv' });
  const scaleData = await db
    .selectFrom('scale_data')
    .innerJoin('scales', 'scales.id', 'scale_data.scale_id')
    .selectAll('scale_data')
    .where('scales.user_id', '=', companyId)
    .execute();
  arch.append(stringify(scaleData, options), { name: 'scale_data.csv' });
  const rearings = await db
    .selectFrom('rearings')
    .selectAll()
    .where('user_id', '=', companyId)
    .execute();
  arch.append(stringify(rearings, options), { name: 'rearings.csv' });
  const rearingTypes = await db
    .selectFrom('rearing_types')
    .selectAll()
    .where('user_id', '=', companyId)
    .execute();
  arch.append(stringify(rearingTypes, options), { name: 'rearing_types.csv' });
}
