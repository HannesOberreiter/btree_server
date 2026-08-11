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
  | 'wax_products'
  | 'wax_origin_types'
  | 'wax_lots'
  | 'wax_operations'
  | 'wax_operation_hives'
  | 'wax_operation_lines'
  | 'wax_inventory_counts'
  | 'queens'
  | 'queen_matings'
  | 'queen_races'
  | 'todos';
type TransferData = Record<TransferKey, CsvRecord[]>;
type CompanyTransferKey = Exclude<
  TransferKey,
  | 'movedates'
  | 'wax_operation_hives'
  | 'wax_operation_lines'
  | 'wax_inventory_counts'
>;

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
  'wax_products',
  'wax_origin_types',
  'wax_lots',
  'wax_operations',
  'wax_operation_hives',
  'wax_operation_lines',
  'wax_inventory_counts',
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
  wax_products: [
    'name',
    'modus',
    'favorite',
    'created_at',
    'updated_at',
    'user_id',
  ],
  wax_origin_types: [
    'name',
    'modus',
    'favorite',
    'created_at',
    'updated_at',
    'user_id',
  ],
  wax_lots: [
    'code',
    'note',
    'product_id',
    'created_by_operation_id',
    'user_id',
    'bee_id',
    'edit_id',
    'created_at',
    'updated_at',
  ],
  wax_operations: [
    'date',
    'type',
    'counterparty',
    'reference',
    'url',
    'note',
    'origin_type_id',
    'reversal_of_id',
    'user_id',
    'bee_id',
    'edit_id',
    'created_at',
    'updated_at',
  ],
  wax_operation_hives: ['operation_id', 'hive_id'],
  wax_operation_lines: ['direction', 'quantity_kg', 'operation_id', 'lot_id'],
  wax_inventory_counts: [
    'operation_id',
    'lot_id',
    'ledger_quantity_kg',
    'counted_quantity_kg',
    'adjustment_kg',
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

const waxOperationTypes = new Set([
  'production',
  'purchase',
  'processing',
  'contract_processing',
  'use',
  'sale',
  'correction',
]);

function hasWaxPrecision(value: number) {
  return Math.abs(value * 100 - Math.round(value * 100)) <= 0.000_001;
}

function validateWaxArchive(data: TransferData) {
  const operations = new Map(
    data.wax_operations.map((row) => [String(row.id), row]),
  );
  const lotsById = new Map(data.wax_lots.map((row) => [String(row.id), row]));
  const lots = new Set(lotsById.keys());
  const linesByOperation = new Map<string, CsvRecord[]>();
  const countsByOperation = new Map<string, CsvRecord[]>();
  for (const line of data.wax_operation_lines) {
    const operationId = String(line.operation_id);
    const quantity = Number(line.quantity_kg);
    if (!operations.has(operationId) || !lots.has(String(line.lot_id)))
      throw new Error('Wax archive contains an invalid line reference');
    if (!['input', 'output'].includes(String(line.direction)))
      throw new Error('Wax archive contains an invalid line direction');
    if (
      !Number.isFinite(quantity) ||
      quantity < 0.01 ||
      !hasWaxPrecision(quantity)
    )
      throw new Error('Wax archive contains an invalid quantity');
    const current = linesByOperation.get(operationId) ?? [];
    current.push(line);
    linesByOperation.set(operationId, current);
  }
  for (const count of data.wax_inventory_counts) {
    const ledgerQuantity = Number(count.ledger_quantity_kg);
    const countedQuantity = Number(count.counted_quantity_kg);
    const adjustment = Number(count.adjustment_kg);
    const operation = operations.get(String(count.operation_id));
    if (
      !operation ||
      operation.type !== 'correction' ||
      !lots.has(String(count.lot_id))
    )
      throw new Error('Wax archive contains an invalid inventory reference');
    if (
      ![ledgerQuantity, countedQuantity, adjustment].every(Number.isFinite) ||
      ![ledgerQuantity, countedQuantity, Math.abs(adjustment)].every(
        hasWaxPrecision,
      ) ||
      ledgerQuantity < 0 ||
      countedQuantity < 0 ||
      Math.abs(countedQuantity - ledgerQuantity - adjustment) > 0.000_001
    )
      throw new Error('Wax archive contains an invalid inventory quantity');
    const operationId = String(count.operation_id);
    const current = countsByOperation.get(operationId) ?? [];
    if (current.some((row) => String(row.lot_id) === String(count.lot_id)))
      throw new Error('Wax archive contains a duplicate inventory count');
    current.push(count);
    countsByOperation.set(operationId, current);
  }
  for (const link of data.wax_operation_hives) {
    if (
      !operations.has(String(link.operation_id)) ||
      !data.hives.some((hive) => String(hive.id) === String(link.hive_id))
    )
      throw new Error('Wax archive contains an invalid hive reference');
  }
  for (const lot of data.wax_lots) {
    if (
      lot.created_by_operation_id !== undefined &&
      lot.created_by_operation_id !== null &&
      (!operations.has(String(lot.created_by_operation_id)) ||
        !data.wax_operation_lines.some(
          (line) =>
            line.direction === 'output' &&
            String(line.lot_id) === String(lot.id) &&
            String(line.operation_id) === String(lot.created_by_operation_id),
        ))
    )
      throw new Error('Wax archive contains an invalid lot creator reference');
  }
  for (const operation of data.wax_operations) {
    const type = String(operation.type);
    if (
      !waxOperationTypes.has(type) ||
      Number.isNaN(Date.parse(String(operation.date))) ||
      (type === 'production' && !operation.origin_type_id)
    )
      throw new Error('Wax archive contains an invalid operation');
    if (
      operation.reversal_of_id !== undefined &&
      operation.reversal_of_id !== null &&
      !operations.has(String(operation.reversal_of_id))
    )
      throw new Error('Wax archive contains an invalid reversal reference');
    const lines = linesByOperation.get(String(operation.id)) ?? [];
    const hasInputs = lines.some((line) => line.direction === 'input');
    const hasOutputs = lines.some((line) => line.direction === 'output');
    if (
      (['production', 'purchase'].includes(type) &&
        (!hasOutputs || hasInputs)) ||
      (['processing', 'contract_processing'].includes(type) &&
        (!hasInputs || !hasOutputs)) ||
      (['use', 'sale'].includes(type) && (!hasInputs || hasOutputs)) ||
      (type === 'correction' &&
        !hasInputs &&
        !hasOutputs &&
        !(countsByOperation.get(String(operation.id))?.length ?? 0))
    )
      throw new Error('Wax archive contains an invalid operation shape');
    const input = lines
      .filter((line) => line.direction === 'input')
      .reduce((sum, line) => sum + Number(line.quantity_kg), 0);
    const output = lines
      .filter((line) => line.direction === 'output')
      .reduce((sum, line) => sum + Number(line.quantity_kg), 0);
    if (
      ['processing', 'contract_processing'].includes(type) &&
      output > input + 0.000_001 &&
      !String(operation.note ?? '').trim()
    )
      throw new Error('Wax archive mass gain has no explanation');
  }
  const balances = new Map<string, number>();
  const sorted = [...data.wax_operations].sort((left, right) => {
    const dateOrder = String(left.date).localeCompare(String(right.date));
    return dateOrder || Number(left.id) - Number(right.id);
  });
  const operationOrder = new Map(
    sorted.map((operation, index) => [String(operation.id), index]),
  );
  for (const [operationIndex, operation] of sorted.entries()) {
    const operationId = String(operation.id);
    const deltas = new Map<string, number>();
    for (const line of linesByOperation.get(operationId) ?? []) {
      const lotId = String(line.lot_id);
      const quantity = Number(line.quantity_kg);
      deltas.set(
        lotId,
        (deltas.get(lotId) ?? 0) +
          (line.direction === 'output' ? quantity : -quantity),
      );
    }
    const inventoryCounts = countsByOperation.get(operationId) ?? [];
    if (inventoryCounts.length) {
      if (!String(operation.note ?? '').trim())
        throw new Error('Wax archive inventory has no explanation');
      const countedLotIds = new Set(
        inventoryCounts.map((count) => String(count.lot_id)),
      );
      if ([...deltas.keys()].some((lotId) => !countedLotIds.has(lotId)))
        throw new Error('Wax archive inventory has an uncounted adjustment');
      for (const count of inventoryCounts) {
        const lotId = String(count.lot_id);
        const lot = lotsById.get(lotId);
        if (!lot)
          throw new Error('Wax archive contains an invalid inventory lot');
        const creatorId = lot.created_by_operation_id;
        const creatorOrder =
          creatorId === undefined || creatorId === null
            ? undefined
            : operationOrder.get(String(creatorId));
        if (creatorOrder !== undefined && creatorOrder > operationIndex)
          throw new Error('Wax archive counts a lot before its creation');
        const ledgerQuantity = Number(count.ledger_quantity_kg);
        const adjustment = Number(count.adjustment_kg);
        if (Math.abs((balances.get(lotId) ?? 0) - ledgerQuantity) > 0.000_001)
          throw new Error('Wax archive inventory ledger quantity is invalid');
        if (Math.abs((deltas.get(lotId) ?? 0) - adjustment) > 0.000_001)
          throw new Error('Wax archive inventory adjustment is invalid');
      }
    }
    for (const [lotId, delta] of deltas) {
      const balance = (balances.get(lotId) ?? 0) + delta;
      if (balance < -0.000_001)
        throw new Error('Wax archive contains negative historical stock');
      balances.set(lotId, balance);
    }
  }
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
  if (!data.apiaries.length && !data.hives.length && !data.wax_lots.length)
    throw new Error('Archive contains no supported company data');
  validateWaxArchive(data);

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

    const waxProducts = await optionRows(
      trx,
      'wax_products',
      data.wax_products,
      companyId,
    );
    const waxOrigins = await optionRows(
      trx,
      'wax_origin_types',
      data.wax_origin_types,
      companyId,
    );
    const waxLotIds = await insertRows(
      trx,
      'wax_lots',
      data.wax_lots.map((row) =>
        clean('wax_lots', row, {
          user_id: companyId,
          bee_id: beeId,
          edit_id: null,
          product_id: mapped(waxProducts, row.product_id),
          created_by_operation_id: null,
        }),
      ),
    );
    const waxLots = idMap(data.wax_lots, waxLotIds);
    const waxOperationIds = await insertRows(
      trx,
      'wax_operations',
      data.wax_operations.map((row) =>
        clean('wax_operations', row, {
          user_id: companyId,
          bee_id: beeId,
          edit_id: null,
          origin_type_id: mapped(waxOrigins, row.origin_type_id),
          reversal_of_id: null,
        }),
      ),
    );
    const waxOperations = idMap(data.wax_operations, waxOperationIds);
    for (const row of data.wax_lots) {
      const lotId = mapped(waxLots, row.id);
      const creatorReference =
        row.created_by_operation_id ??
        data.wax_operation_lines.find(
          (line) =>
            line.direction === 'output' &&
            String(line.lot_id) === String(row.id),
        )?.operation_id;
      const creatorId = mapped(waxOperations, creatorReference);
      if (lotId && creatorId)
        await trx
          .updateTable('wax_lots')
          .set({ created_by_operation_id: creatorId })
          .where('id', '=', lotId)
          .execute();
    }
    for (const row of data.wax_operations) {
      const operationId = mapped(waxOperations, row.id);
      const reversalOfId = mapped(waxOperations, row.reversal_of_id);
      if (operationId && reversalOfId)
        await trx
          .updateTable('wax_operations')
          .set({
            reversal_of_id: reversalOfId,
            ...(row.updated_at && {
              updated_at: new Date(String(row.updated_at)),
            }),
          })
          .where('id', '=', operationId)
          .execute();
    }
    await insertRows(
      trx,
      'wax_operation_hives',
      data.wax_operation_hives.map((row) =>
        clean('wax_operation_hives', row, {
          operation_id: mapped(waxOperations, row.operation_id),
          hive_id: mapped(hives, row.hive_id),
        }),
      ),
    );
    await insertRows(
      trx,
      'wax_operation_lines',
      data.wax_operation_lines.map((row) =>
        clean('wax_operation_lines', row, {
          operation_id: mapped(waxOperations, row.operation_id),
          lot_id: mapped(waxLots, row.lot_id),
        }),
      ),
    );
    await insertRows(
      trx,
      'wax_inventory_counts',
      data.wax_inventory_counts.map((row) =>
        clean('wax_inventory_counts', row, {
          operation_id: mapped(waxOperations, row.operation_id),
          lot_id: mapped(waxLots, row.lot_id),
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
  table: CompanyTransferKey,
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
  const companyTables = transferKeys.filter(
    (key): key is CompanyTransferKey =>
      ![
        'movedates',
        'wax_operation_hives',
        'wax_operation_lines',
        'wax_inventory_counts',
      ].includes(key),
  );
  for (const table of companyTables)
    await appendTable(db, arch, table, companyId, options);
  const waxOperationHives = await db
    .selectFrom('wax_operation_hives')
    .innerJoin(
      'wax_operations',
      'wax_operations.id',
      'wax_operation_hives.operation_id',
    )
    .selectAll('wax_operation_hives')
    .where('wax_operations.user_id', '=', companyId)
    .execute();
  arch.append(stringify(waxOperationHives, options), {
    name: 'wax_operation_hives.csv',
  });
  const waxOperationLines = await db
    .selectFrom('wax_operation_lines')
    .innerJoin(
      'wax_operations',
      'wax_operations.id',
      'wax_operation_lines.operation_id',
    )
    .selectAll('wax_operation_lines')
    .where('wax_operations.user_id', '=', companyId)
    .execute();
  arch.append(stringify(waxOperationLines, options), {
    name: 'wax_operation_lines.csv',
  });
  const waxInventoryCounts = await db
    .selectFrom('wax_inventory_counts')
    .innerJoin(
      'wax_operations',
      'wax_operations.id',
      'wax_inventory_counts.operation_id',
    )
    .selectAll('wax_inventory_counts')
    .where('wax_operations.user_id', '=', companyId)
    .execute();
  arch.append(stringify(waxInventoryCounts, options), {
    name: 'wax_inventory_counts.csv',
  });
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
