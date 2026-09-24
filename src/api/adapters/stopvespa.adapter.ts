import { isDeepStrictEqual } from 'node:util';

import { sql } from 'kysely';

import { KyselyServer } from '../../servers/kysely.server.js';
import { RedisServer } from '../../servers/redis.server.js';
import type { Point } from '../../types/db.types.js';
import {
  insertObservations,
  recentObservationsCacheKey,
  yearlyObservationsCacheKey,
} from '../modules/observation.module.js';
import type { ObservationInsert } from '../modules/observation.module.js';
import { parseStopVespaPage } from './stopvespa.parser.js';
import type { StopVespaObservation } from './stopvespa.parser.js';

const source = 'stopvespa.icnf.pt';
const endpoint =
  'https://services9.arcgis.com/yDJ0v2H03rmzNPRm/arcgis/rest/services/STOPvespa_municipio_dados_vespa/FeatureServer/0/query';
const pageSize = 1000;
let queue: Promise<unknown> = Promise.resolve();

export function fetchStopVespa() {
  const result = queue.then(importStopVespa);
  queue = result.catch(() => undefined);
  return result;
}

async function importStopVespa() {
  const records = new Map<string, StopVespaObservation>();
  let skippedRecords = 0;
  let offset = 0;
  let lastObjectId = -1;
  for (;;) {
    const url = new URL(endpoint);
    url.search = new URLSearchParams({
      f: 'json',
      where: '1=1',
      outFields:
        'ObjectId,globalid,data_observ,tipo_observ,tipo,exterminad,data_exter',
      returnGeometry: 'true',
      outSR: '4326',
      orderByFields: 'ObjectId ASC',
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
    }).toString();
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'btree.at/pest-map',
      },
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok)
      throw new Error(`STOPvespa returned HTTP ${response.status}`);
    const page = parseStopVespaPage(await response.json());
    if (
      page.objectIds.length > pageSize ||
      (page.exceededTransferLimit && page.objectIds.length === 0)
    ) {
      throw new Error('Invalid STOPvespa transfer limit');
    }
    for (const objectId of page.objectIds) {
      if (objectId <= lastObjectId)
        throw new Error('STOPvespa pagination did not advance');
      lastObjectId = objectId;
    }
    skippedRecords += page.skippedRecords;
    for (const record of page.records) {
      const previous = records.get(record.externalUuid);
      if (previous && !isDeepStrictEqual(previous, record))
        throw new Error('Conflicting STOPvespa UUID');
      records.set(record.externalUuid, record);
    }
    offset += page.objectIds.length;
    if (!page.exceededTransferLimit && page.objectIds.length < pageSize) break;
    if (offset >= 1_000_000)
      throw new Error('STOPvespa pagination safety limit exceeded');
  }

  const db = KyselyServer.getInstance().db;
  const changedYears = new Set<number>();
  let newObservations = 0;
  let updatedObservations = 0;
  // No writes until the entire response has passed pagination/schema/identity validation.
  await db.transaction().execute(async (transaction) => {
    const existing = await transaction
      .selectFrom('observations')
      .select(['id', 'external_uuid', 'location'])
      // The connection stores UTC but returns DATETIME strings without an offset.
      .select(
        sql<string | null>`DATE_FORMAT(observed_at, '%Y-%m-%dT%H:%i:%sZ')`.as(
          'observed_at',
        ),
      )
      .select(sql<Record<string, unknown> | null>`data`.as('source_data'))
      .where('external_service', '=', source)
      .execute();
    const existingByUuid = new Map(
      existing.map((row) => [row.external_uuid?.toLowerCase(), row]),
    );
    const inserts: ObservationInsert[] = [];
    for (const record of records.values()) {
      const previous = existingByUuid.get(record.externalUuid);
      const observedAt = new Date(record.observedAt);
      if (!previous) {
        inserts.push({
          external_uuid: record.externalUuid,
          external_service: source,
          observed_at: record.observedAt,
          location: record.location,
          taxa: 'Vespa velutina',
          data: record.data,
        });
        changedYears.add(observedAt.getUTCFullYear());
        continue;
      }
      const previousDate = previous.observed_at
        ? new Date(previous.observed_at)
        : null;
      if (
        // The existing DATETIME column has second precision.
        previousDate?.getTime() ===
          Math.floor(observedAt.getTime() / 1000) * 1000 &&
        previous.location?.x === record.location.lat &&
        previous.location?.y === record.location.lng &&
        isDeepStrictEqual(previous.source_data, record.data)
      )
        continue;
      await transaction
        .updateTable('observations')
        .set({
          observed_at: observedAt,
          location: sql<Point>`PointFromText(${`POINT(${record.location.lat} ${record.location.lng})`})`,
          data: JSON.stringify(record.data),
        })
        .where('id', '=', previous.id)
        .execute();
      updatedObservations++;
      changedYears.add(observedAt.getUTCFullYear());
      if (previousDate) changedYears.add(previousDate.getUTCFullYear());
    }
    await insertObservations(transaction, inserts);
    newObservations = inserts.length;
  });
  if (changedYears.size > 0)
    await RedisServer.client.del([
      recentObservationsCacheKey('Vespa velutina'),
      ...[...changedYears].map((year) =>
        yearlyObservationsCacheKey('Vespa velutina', year),
      ),
    ]);
  return { newObservations, updatedObservations, skippedRecords };
}
