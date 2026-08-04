import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type { Point } from '../../types/db.types.js';

export type Taxa = 'Vespa velutina' | 'Aethina tumida';

export interface ObservationInsert {
  external_id?: number;
  external_uuid?: string;
  external_service: string;
  observed_at: string;
  location: { lat: number; lng: number };
  taxa: Taxa;
  data?: Record<string, unknown>;
}

export function mapPublicTaxa(taxa: 'velutina' | 'aethina_tumida'): Taxa {
  return taxa === 'velutina' ? 'Vespa velutina' : 'Aethina tumida';
}

export function recentObservationsCacheKey(taxa: Taxa) {
  return `cache:${taxa}ObservationsRecent`;
}

export function yearlyObservationsCacheKey(taxa: Taxa, year: number) {
  return `cache:${taxa}ObservationsYear:${year}`;
}

export async function insertObservations(
  db: Database,
  observations: ObservationInsert[],
) {
  if (observations.length === 0) return;

  for (const observation of observations) {
    await db
      .insertInto('observations')
      .values({
        external_id: observation.external_id ?? null,
        external_uuid: observation.external_uuid ?? null,
        external_service: observation.external_service,
        observed_at: new Date(observation.observed_at),
        location: sql<Point>`PointFromText(${`POINT(${observation.location.lat} ${observation.location.lng})`})`,
        taxa: observation.taxa,
        data: JSON.stringify(observation.data ?? null),
      })
      .execute();
  }
}

export async function filterNewObservationExternalIds(
  db: Database,
  externalIds: number[],
  externalService: string,
): Promise<Set<number>> {
  if (externalIds.length === 0) return new Set();
  const existing = await db
    .selectFrom('observations')
    .select('external_id')
    .where('external_service', '=', externalService)
    .where('external_id', 'in', externalIds)
    .execute();
  const existingIds = new Set(existing.map((row) => row.external_id));
  return new Set(externalIds.filter((id) => !existingIds.has(id)));
}

export async function filterNewObservationExternalUuids(
  db: Database,
  uuids: string[],
  externalService: string,
): Promise<Set<string>> {
  if (uuids.length === 0) return new Set();
  const existing = await db
    .selectFrom('observations')
    .select('external_uuid')
    .where('external_service', '=', externalService)
    .where('external_uuid', 'in', uuids)
    .execute();
  const existingUuids = new Set(existing.map((row) => row.external_uuid));
  return new Set(uuids.filter((uuid) => !existingUuids.has(uuid)));
}

function selectPublicObservations(db: Database) {
  return db
    .selectFrom('observations')
    .select([
      sql<Point>`location`.as('location'),
      sql<string>`JSON_EXTRACT(data, '$.uri')`.as('uri'),
      sql<Date>`observed_at`.as('observed_at'),
    ]);
}

export function listRecentObservations(db: Database, taxa: Taxa) {
  const end = new Date();
  const start = new Date(end.getTime() - 1000 * 60 * 60 * 24 * 182);
  return selectPublicObservations(db)
    .where('taxa', '=', taxa)
    .where('observed_at', '>=', start)
    .where('observed_at', '<=', end)
    .execute();
}

export function listObservationsByYear(db: Database, taxa: Taxa, year: number) {
  return selectPublicObservations(db)
    .where('taxa', '=', taxa)
    .where('observed_at', '>=', new Date(`${year}-01-01`))
    .where('observed_at', '<=', new Date(`${year}-12-31`))
    .execute();
}

export async function countObservationsByTaxa(db: Database, taxa: Taxa) {
  const result = await db
    .selectFrom('observations')
    .select(sql<number | string>`COUNT(id)`.as('count'))
    .where('taxa', '=', taxa)
    .executeTakeFirstOrThrow();
  return { count: Number(result.count) };
}

export async function getRandomObservationSample(
  db: Database,
  externalService: string,
  limit: number,
) {
  const countResult = await db
    .selectFrom('observations')
    .select(sql<number | string>`COUNT(id)`.as('count'))
    .where('external_service', '=', externalService)
    .where('external_id', 'is not', null)
    .executeTakeFirstOrThrow();
  const count = Number(countResult.count);
  if (count === 0) return [];

  const randomOffset = Math.max(0, Math.floor(Math.random() * (count - limit)));
  return db
    .selectFrom('observations')
    .selectAll()
    .where('external_service', '=', externalService)
    .where('external_id', 'is not', null)
    .offset(randomOffset)
    .limit(limit)
    .execute();
}

export async function deleteObservationsByIds(db: Database, ids: number[]) {
  if (ids.length === 0) return;
  await db.deleteFrom('observations').where('id', 'in', ids).execute();
}

export function getObservationExternalIdsSample(
  db: Database,
  externalService: string,
  offset: number,
  limit: number,
) {
  return db
    .selectFrom('observations')
    .selectAll()
    .where('external_service', '=', externalService)
    .where('external_id', 'is not', null)
    .offset(offset)
    .limit(limit)
    .execute();
}
