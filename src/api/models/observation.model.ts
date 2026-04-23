import type { Kysely } from 'kysely';
import type { DB } from '../../types/db.types.js';
import { sql } from 'kysely';
import { KyselyServer } from '../../servers/kysely.server.js';

export type Taxa = 'Vespa velutina' | 'Aethina tumida';

export interface ObservationInsert {
  external_id?: number
  external_uuid?: string
  external_service: string
  observed_at: string
  location: { lat: number, lng: number }
  taxa: Taxa
  data?: Record<string, any>
}

function getDb(): Kysely<DB> {
  return KyselyServer.getInstance().db;
}

export class ObservationModel {
  /**
   * Insert multiple observations using raw SQL for POINT conversion.
   */
  static async insertBatch(observations: ObservationInsert[]) {
    if (observations.length === 0)
      return;
    const db = getDb();

    for (const obs of observations) {
      await db
        .insertInto('observations')
        .values({
          external_id: obs.external_id ?? null,
          external_uuid: obs.external_uuid ?? null,
          external_service: obs.external_service,
          observed_at: new Date(obs.observed_at),
          location: sql`PointFromText(${`POINT(${obs.location.lat} ${obs.location.lng})`})` as any,
          taxa: obs.taxa,
          data: JSON.stringify(obs.data ?? null),
        })
        .execute();
    }
  }

  /**
   * Find which external_ids already exist for a given service.
   * Returns the set of IDs that are new (not in the DB).
   */
  static async filterNewExternalIds(externalIds: number[], externalService: string): Promise<Set<number>> {
    if (externalIds.length === 0)
      return new Set();
    const db = getDb();

    const existing = await db
      .selectFrom('observations')
      .select('external_id')
      .where('external_service', '=', externalService)
      .where('external_id', 'in', externalIds)
      .execute();

    const existingSet = new Set(existing.map(o => o.external_id));
    return new Set(externalIds.filter(id => !existingSet.has(id)));
  }

  /**
   * Find which external_uuids already exist for a given service.
   */
  static async filterNewExternalUuids(uuids: string[], externalService: string): Promise<Set<string>> {
    if (uuids.length === 0)
      return new Set();
    const db = getDb();

    const existing = await db
      .selectFrom('observations')
      .select('external_uuid')
      .where('external_service', '=', externalService)
      .where('external_uuid', 'in', uuids)
      .execute();

    const existingSet = new Set(existing.map(o => o.external_uuid));
    return new Set(uuids.filter(uuid => !existingSet.has(uuid)));
  }

  /**
   * Get recent observations (last ~182 days) for a given taxa, with location and uri.
   */
  static async getRecent(taxa: Taxa) {
    const db = getDb();
    const start = new Date(Date.now() - 1000 * 60 * 60 * 24 * 182);
    const end = new Date();

    return db
      .selectFrom('observations')
      .select([
        'location',
        sql<string>`JSON_EXTRACT(data, '$.uri')`.as('uri'),
        'observed_at',
      ])
      .where('taxa', '=', taxa)
      .where('observed_at', '>=', start as any)
      .where('observed_at', '<=', end as any)
      .execute();
  }

  /**
   * Get observations for a specific year.
   */
  static async getByYear(taxa: Taxa, year: number) {
    const db = getDb();

    return db
      .selectFrom('observations')
      .select([
        'location',
        sql<string>`JSON_EXTRACT(data, '$.uri')`.as('uri'),
        'observed_at',
      ])
      .where('taxa', '=', taxa)
      .where('observed_at', '>=', `${year}-01-01` as any)
      .where('observed_at', '<=', `${year}-12-31` as any)
      .execute();
  }

  /**
   * Count observations for a taxa.
   */
  static async countByTaxa(taxa: Taxa) {
    const db = getDb();

    const result = await db
      .selectFrom('observations')
      .select(sql<number>`count(id)`.as('count'))
      .where('taxa', '=', taxa)
      .executeTakeFirstOrThrow();

    return result;
  }

  /**
   * Get a random sample of records for a service (for cleanup checks).
   */
  static async getRandomSample(externalService: string, limit: number) {
    const db = getDb();

    const countResult = await db
      .selectFrom('observations')
      .select(sql<number>`count(id)`.as('count'))
      .where('external_service', '=', externalService)
      .where('external_id', 'is not', null)
      .executeTakeFirstOrThrow();

    const count = Number(countResult.count);
    if (count === 0)
      return [];

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

  /**
   * Delete observations by their internal IDs.
   */
  static async deleteByIds(ids: number[]) {
    if (ids.length === 0)
      return;
    const db = getDb();

    await db
      .deleteFrom('observations')
      .where('id', 'in', ids)
      .execute();
  }

  /**
   * Get external_ids for a service (used by iNat cleanup).
   */
  static async getExternalIdsSample(externalService: string, offset: number, limit: number) {
    const db = getDb();

    return db
      .selectFrom('observations')
      .selectAll()
      .where('external_service', '=', externalService)
      .where('external_id', 'is not', null)
      .offset(offset)
      .limit(limit)
      .execute();
  }
}
