import { KyselyServer } from '../../servers/kysely.server.js';
import { RedisServer } from '../../servers/redis.server.js';
import {
  filterNewObservationExternalIds,
  insertObservations,
  recentObservationsCacheKey,
  yearlyObservationsCacheKey,
} from '../modules/observation.module.js';
import type { ObservationInsert } from '../modules/observation.module.js';
import {
  parseStopVelutinaDetailDate,
  parseStopVelutinaMarkers,
} from './stopvelutina.parser.js';

const source = 'stopvelutina.it';
const mapUrl =
  'https://www.beewatching.it/sito-stopvelutina-mappa-segnalazioni-embedded/?filtro_tipo_vespa=vespa_velutina';
let queue: Promise<unknown> = Promise.resolve();

export function fetchStopVelutina() {
  const result = queue.then(importStopVelutina);
  queue = result.catch(() => undefined);
  return result;
}

async function fetchHtml(url: string | URL) {
  const response = await fetch(url, {
    headers: { Accept: 'text/html', 'User-Agent': 'btree.at/pest-map' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok)
    throw new Error(`Stop Velutina returned HTTP ${response.status}`);
  return response.text();
}

async function importStopVelutina() {
  const db = KyselyServer.getInstance().db;
  const parsed = parseStopVelutinaMarkers(await fetchHtml(mapUrl));
  const newIds = await filterNewObservationExternalIds(
    db,
    parsed.records.map((record) => record.externalId),
    source,
  );
  const unseen = parsed.records.filter((record) =>
    newIds.has(record.externalId),
  );
  const observations: ObservationInsert[] = [];
  let skippedRecords = parsed.skippedRecords;
  let next = 0;
  // Wait for all workers even after failure, so the next queued import cannot overlap.
  const workers = await Promise.allSettled(
    Array.from({ length: Math.min(4, unseen.length) }, async () => {
      while (next < unseen.length) {
        const marker = unseen[next++];
        const url = new URL(
          'https://www.beewatching.it/lsbox/ajaxGetInfoboxMappaStopVelutina.php',
        );
        url.searchParams.set('id', `c_infobox_${marker.externalId}`);
        url.searchParams.set('single', '0');
        const observedAt = parseStopVelutinaDetailDate(
          await fetchHtml(url),
          marker.year,
        );
        if (!observedAt) {
          skippedRecords++;
          continue;
        }
        observations.push({
          external_id: marker.externalId,
          external_service: source,
          observed_at: observedAt,
          location: marker.location,
          taxa: 'Vespa velutina',
          data: {
            observationType: marker.observationType,
            uri: 'https://www.stopvelutina.it/dove/',
            detailUri: url.toString(),
          },
        });
      }
    }),
  );
  const failure = workers.find((worker) => worker.status === 'rejected');
  if (failure?.status === 'rejected') throw failure.reason;
  await db
    .transaction()
    .execute((transaction) => insertObservations(transaction, observations));
  if (observations.length > 0) {
    const years = new Set(
      observations.map((record) =>
        new Date(record.observed_at).getUTCFullYear(),
      ),
    );
    await RedisServer.client.del([
      recentObservationsCacheKey('Vespa velutina'),
      ...[...years].map((year) =>
        yearlyObservationsCacheKey('Vespa velutina', year),
      ),
    ]);
  }
  return { newObservations: observations.length, skippedRecords };
}
