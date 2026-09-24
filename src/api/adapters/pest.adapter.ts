import { isDeepStrictEqual } from 'node:util';

import { sql } from 'kysely';
import proj4 from 'proj4';

import { KyselyServer } from '../../servers/kysely.server.js';
import { RedisServer } from '../../servers/redis.server.js';
import { Logger } from '../../services/logger.service.js';
import type { Point } from '../../types/db.types.js';
import {
  deleteObservationsByIds,
  filterNewObservationExternalIds,
  getRandomObservationSample,
  insertObservations,
  recentObservationsCacheKey,
  yearlyObservationsCacheKey,
} from '../modules/observation.module.js';
import type { ObservationInsert, Taxa } from '../modules/observation.module.js';
import { parseBienengesundheitObservations } from './bienengesundheit.parser.js';
import { parseFrelonasiatiqueObservations } from './frelonasiatique.parser.js';
import { fetchStopVelutina } from './stopvelutina.adapter.js';
import { fetchStopVespa } from './stopvespa.adapter.js';

const observationDb = KyselyServer.getInstance().db;

export async function fetchObservations(taxa: Taxa = 'Vespa velutina') {
  const fInat = fetchInat();
  const fObservation = fetchObservationOrg();

  const cleanupInat = await fInat.cleanupOldObs();
  const cleanupObservationOrg = await fObservation.cleanupOldObs();

  const inat = await fInat.fetchNewObs(taxa);
  const observationOrg = await fObservation.fetchNewObs(taxa);
  const artenfinderNet = await fetchArtenfinderNet(taxa);
  const infoFaunaCh =
    taxa === 'Aethina tumida'
      ? await fetchInfoFaunaCh(taxa)
      : { newObservations: 0 };
  const asiatischeHornisseCh =
    taxa === 'Vespa velutina'
      ? await fetchAsiatischeHornisseCh()
      : { newObservations: 0 };

  const frelonsAsiatiques =
    taxa === 'Vespa velutina'
      ? await fetchFrelonsAsiatiques()
      : { newObservations: 0 };
  const bienengesundheitAt =
    taxa === 'Vespa velutina'
      ? await fetchBienengesundheitAt()
      : { newObservations: 0 };

  // Each new provider reports its own failure without suppressing the other or cache cleanup.
  const stopVelutina =
    taxa === 'Vespa velutina'
      ? await fetchStopVelutina().catch((error: unknown) => ({
          error: error instanceof Error ? error.message : String(error),
        }))
      : undefined;
  const stopVespa =
    taxa === 'Vespa velutina'
      ? await fetchStopVespa().catch((error: unknown) => ({
          error: error instanceof Error ? error.message : String(error),
        }))
      : undefined;

  /** after fetching new taxa we want to cleanup any possible cached map results */
  const redis = RedisServer.client;
  const currentYear = new Date().getFullYear();
  for (const cacheKey of [
    recentObservationsCacheKey(taxa),
    yearlyObservationsCacheKey(taxa, currentYear),
    yearlyObservationsCacheKey(taxa, currentYear - 1),
  ]) {
    void redis.del(cacheKey).catch((error: unknown) => {
      Logger.getInstance().log(
        'warn',
        'Failed to invalidate observation cache',
        {
          error,
          cacheKey,
        },
      );
    });
  }

  return {
    taxa,
    ...(taxa === 'Vespa velutina' ? { stopVelutina, stopVespa } : {}),
    iNaturalist: inat,
    frelonsAsiatiques,
    bienengesundheitAt,
    artenfinderNet,
    observationOrg,
    infoFaunaCh,
    asiatischeHornisseCh,
    cleanup: {
      iNaturalist: cleanupInat,
      ObservationOrg: cleanupObservationOrg,
    },
  };
}

// Serialize monthly and regular imports so they cannot insert the same IDs twice.
let swissImportQueue: Promise<unknown> = Promise.resolve();

export function fetchAsiatischeHornisseCh(fullSync = false) {
  const result = swissImportQueue.then(() =>
    importAsiatischeHornisseCh(fullSync),
  );
  swissImportQueue = result.catch(() => undefined);
  return result;
}

async function importAsiatischeHornisseCh(fullSync: boolean) {
  const externalService = 'asiatischehornisse.ch';
  const existing = await observationDb
    .selectFrom('observations')
    .select(['id', 'external_id', 'location'])
    .select(
      sql<string | null>`DATE_FORMAT(observed_at, '%Y-%m-%dT%H:%i:%sZ')`.as(
        'observed_at',
      ),
    )
    .select(sql<Record<string, unknown> | null>`data`.as('source_data'))
    .where('external_service', '=', externalService)
    .execute();
  const existingById = new Map(existing.map((row) => [row.external_id, row]));
  const url = new URL('https://frelonasiatique.ch/api/v1/observations/map');
  url.searchParams.set('srsname', 'EPSG:4326');
  url.searchParams.set('validated_only', 'true');
  if (!fullSync && existing.length > 0) {
    const now = new Date();
    const year = now.getFullYear();
    // Include late reports from the previous year throughout January.
    url.searchParams.set(
      'date_from',
      `${now.getMonth() === 0 ? year - 1 : year}-01-01`,
    );
    url.searchParams.set('date_to', `${year}-12-31`);
  }
  const response = await fetch(url, {
    headers: {
      Accept: 'application/geo+json, application/json',
      'User-Agent': 'btree.at/pest-map',
    },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(`frelonasiatique.ch returned HTTP ${response.status}`);
  }

  const records = parseFrelonasiatiqueObservations(await response.json());
  if (!url.searchParams.has('date_from') && records.length === 0) {
    throw new Error('Empty frelonasiatique.ch full response');
  }
  const observations: ObservationInsert[] = records.map((record) => ({
    external_id: record.externalId,
    external_service: externalService,
    observed_at: record.observedAt,
    location: record.location,
    taxa: 'Vespa velutina',
    data: {
      observationType: record.observationType,
      canton: record.canton,
      municipality: record.municipality,
      nestState: record.nestState,
      uri: 'https://asiatischehornisse.ch/karte',
    },
  }));

  const newObservations: ObservationInsert[] = [];
  const changedYears = new Set<number>();
  let updatedObservations = 0;
  await observationDb.transaction().execute(async (db) => {
    for (const observation of observations) {
      const previous = existingById.get(observation.external_id!);
      const observedAt = new Date(observation.observed_at);
      if (!previous) {
        newObservations.push(observation);
        changedYears.add(observedAt.getUTCFullYear());
        continue;
      }
      const previousDate = previous.observed_at
        ? new Date(previous.observed_at)
        : null;
      if (
        previousDate?.getTime() === observedAt.getTime() &&
        previous.location?.x === observation.location.lat &&
        previous.location?.y === observation.location.lng &&
        isDeepStrictEqual(previous.source_data, observation.data)
      )
        continue;

      await db
        .updateTable('observations')
        .set({
          observed_at: observedAt,
          location: sql<Point>`PointFromText(${`POINT(${observation.location.lat} ${observation.location.lng})`})`,
          data: JSON.stringify(observation.data),
        })
        .where('id', '=', previous.id)
        .execute();
      updatedObservations++;
      changedYears.add(observedAt.getUTCFullYear());
      if (previousDate) changedYears.add(previousDate.getUTCFullYear());
    }
    await insertObservations(db, newObservations);
  });
  if (changedYears.size > 0) {
    await RedisServer.client.del([
      recentObservationsCacheKey('Vespa velutina'),
      ...[...changedYears].map((year) =>
        yearlyObservationsCacheKey('Vespa velutina', year),
      ),
    ]);
  }
  return { newObservations: newObservations.length, updatedObservations };
}

export async function fetchBienengesundheitAt() {
  const url = 'https://www.bienengesundheit.at/vespa-velutina';
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'btree.at/pest-map',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`Bienengesundheit.at returned HTTP ${response.status}`);
  }

  const records = parseBienengesundheitObservations(await response.text());
  if (records.length === 0) {
    throw new Error('Bienengesundheit.at returned no parseable observations');
  }

  const newIds = await filterNewObservationExternalIds(
    observationDb,
    records.map((record) => record.externalId),
    'Bienengesundheit.at',
  );
  const observations: ObservationInsert[] = records
    .filter((record) => newIds.has(record.externalId))
    .map((record) => ({
      external_id: record.externalId,
      external_service: 'Bienengesundheit.at',
      observed_at: record.observedAt,
      location: record.location,
      taxa: 'Vespa velutina',
      data: {
        region: record.region,
        regionId: record.regionId,
        reportType: record.reportType,
        uri: url,
      },
    }));

  await insertObservations(observationDb, observations);
  return { newObservations: observations.length };
}

/**
 * Fetch Vespa velutina nest/insect reports from signal.frelonsasiatiques.fr
 * (Auvergne-Rhône-Alpes region, France).
 *
 * The API requires a PHP session. For each department:
 * 1. Visit the list page with filters → receives a PHPSESSID cookie
 * 2. Call the markers API with that session → returns filtered JSON
 */
export async function fetchFrelonsAsiatiques() {
  const BASE_URL = 'https://signal.frelonsasiatiques.fr/iceadmin/cartographie';
  const UA = 'Mozilla/5.0 (compatible; btree.at/pest-map)';

  // DB ID → French department number
  const DEPARTMENTS: Record<number, string> = {
    1: '01', // Ain
    3: '03', // Allier
    7: '07', // Ardèche
    15: '15', // Cantal
    25: '26', // Drôme
    39: '38', // Isère
    43: '42', // Loire
    44: '43', // Haute-Loire
    64: '63', // Puy-de-Dôme
    70: '69', // Rhône
    74: '73', // Savoie
    75: '74', // Haute-Savoie
  };

  // Confirmed statuses: 4=Confirmé, 6=En cours de destruction, 7=Non détruit, 8=Détruit
  const REPORT_STATUSES = [4, 6, 7, 8];

  // Use current season (Feb Y to Jan Y+1) and previous season
  const now = new Date();
  const currentSeasonYear =
    now.getMonth() >= 1 ? now.getFullYear() : now.getFullYear() - 1;
  const years = [currentSeasonYear];

  let totalNew = 0;

  for (const year of years) {
    for (const [deptId, deptNum] of Object.entries(DEPARTMENTS)) {
      try {
        const records = await fetchDepartment(Number(deptId), year);
        if (records.length === 0) {
          continue;
        }

        const batchIds = records.map((r: any) => Number(r.id));
        const newIds = await filterNewObservationExternalIds(
          observationDb,
          batchIds,
          'Frelons Asiatiques FR',
        );

        const observations: ObservationInsert[] = [];
        for (const r of records) {
          if (!newIds.has(Number(r.id))) {
            continue;
          }
          if (!r.latitude || !r.longitude) {
            continue;
          }

          observations.push({
            external_id: Number(r.id),
            external_service: 'Frelons Asiatiques FR',
            observed_at: `${r.date}T00:00:00Z`,
            location: {
              lat: Number(r.latitude),
              lng: Number(r.longitude),
            },
            taxa: 'Vespa velutina',
            data: {
              reportCategory: r.reportCategory,
              reportStatus: r.reportStatus,
              nestSupport: r.nestSupport,
              nestHeight: r.nestHeight,
              nestDiameter: r.nestDiameter,
              city: r.cityLabel,
              postalCode: r.cityPostalCode,
              department: deptNum,
              uri: `https://signal.frelonsasiatiques.fr`,
            },
          });
        }

        if (observations.length > 0) {
          await insertObservations(observationDb, observations);
          totalNew += observations.length;
        }
      } catch {
        // Skip department on error, continue with others
      }
    }
  }

  return { newObservations: totalNew };

  async function fetchDepartment(deptId: number, year: number): Promise<any[]> {
    // Step 1: Visit list page to establish session with filters
    const listParams = new URLSearchParams({
      'filter[city__department][value]': String(deptId),
      'filter[date][value]': String(year),
      'filter[reportCategory][value]': '',
    });
    for (const status of REPORT_STATUSES) {
      listParams.append('filter[reportStatus][value][]', String(status));
    }

    const listResponse = await fetch(`${BASE_URL}/list?${listParams}`, {
      headers: { 'User-Agent': UA },
      redirect: 'manual',
    });

    const setCookies = listResponse.headers.getSetCookie?.() || [];
    const sessionCookie = setCookies
      .find((c) => c.includes('PHPSESSID'))
      ?.split(';')[0];
    await listResponse.text(); // consume body

    if (!sessionCookie) {
      return [];
    }

    // Step 2: Call markers API with the session
    const apiParams = new URLSearchParams({
      _page: '1',
      _per_page: '0',
      'reportCategory[value]': '',
      'city__department[value]': String(deptId),
      'date[value]': String(year),
    });
    for (let i = 0; i < REPORT_STATUSES.length; i++) {
      apiParams.append(`reportStatus[value][${i}]`, String(REPORT_STATUSES[i]));
    }

    const apiResponse = await fetch(`${BASE_URL}/markers_api?${apiParams}`, {
      headers: {
        'User-Agent': UA,
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
        Cookie: sessionCookie,
        Referer: `${BASE_URL}/list`,
      },
    });

    if (!apiResponse.ok) return [];
    const data = await apiResponse.json();
    return Array.isArray(data) ? data : [];
  }
}

export function fetchInat() {
  const URL = 'https://api.inaturalist.org/v2/observations';
  const TAXON_IDS: Record<Taxa, number[]> = {
    'Vespa velutina': [119019, 560197], // Vespa velutina and Vespa velutina nigrithorax
    'Aethina tumida': [457066],
  };
  const FIELDS =
    '(id:!t,uri:!t,quality_grade:!t,time_observed_at:!t,location:!t,taxon:(id:!t))';

  /**
   * @description Randomly select 200 iNat observations from database and check if they are still present and also the correct taxon
   */
  async function cleanupOldObs() {
    const oldRecords = await getRandomObservationSample(
      observationDb,
      'iNaturalist',
      200,
    );
    const notFound: number[] = [];
    const wrongTaxon: number[] = [];
    const removedExternalIds: number[] = [];

    const ids = oldRecords.map((o) => o.external_id).join(',');
    if (ids.length === 0) {
      return { checked: 0, notFound: 0, wrongTaxon: 0 };
    }

    const url = `${URL}?id=${ids}&fields=${FIELDS}&per_page=200`;
    const response = await fetch(url);
    const res = await response.json();

    const foundIds = new Set(res.results.map((o: any) => o.id));
    for (const record of oldRecords) {
      if (!foundIds.has(record.external_id)) {
        notFound.push(record.id);
        removedExternalIds.push(record.external_id!);
      } else {
        const observation = res.results.find(
          (o: any) => o.id === record.external_id,
        );
        if (!TAXON_IDS[record.taxa as Taxa].includes(observation.taxon.id)) {
          wrongTaxon.push(record.id);
          removedExternalIds.push(record.external_id!);
        }
      }
    }

    const toDelete = [...notFound, ...wrongTaxon];
    await deleteObservationsByIds(observationDb, toDelete);

    return {
      checked: oldRecords.length,
      notFound: notFound.length,
      wrongTaxon: wrongTaxon.length,
      removedExternalIds,
    };
  }

  async function fetchNewObs(taxa: Taxa, monthsBefore = 1) {
    let idAbove = 1;
    let newObservations = 0;
    let createdAtD1: Date | string = new Date();
    createdAtD1.setMonth(createdAtD1.getMonth() - monthsBefore);
    createdAtD1 = createdAtD1.toISOString().split('T')[0];
    const createdAtD2 = new Date().toISOString().split('T')[0];

    while (idAbove > 0) {
      const url = `${URL}?taxon_id=${TAXON_IDS[taxa].join(',')}&verifiable=true&quality_grade=research&order=asc&order_by=id&per_page=200&fields=${FIELDS}&created_d1=${createdAtD1}&created_d2=${createdAtD2}&id_above=${idAbove}`;
      const response = await fetch(url);
      const res = await response.json();
      if (!res.results || res.results.length === 0) break;
      idAbove = res.results.at(-1).id;

      const batchIds = res.results
        .filter((o: any) => o.time_observed_at && o.location)
        .map((o: any) => Number(o.id));
      const newIds = await filterNewObservationExternalIds(
        observationDb,
        batchIds,
        'iNaturalist',
      );

      const observations: ObservationInsert[] = [];
      for (let i = 0; i < res.results.length; i++) {
        const observation = res.results[i];
        if (!observation.time_observed_at) continue;
        if (!observation.location) continue;
        if (!newIds.has(Number(observation.id))) continue;
        newObservations++;
        const data = { ...observation };
        delete data.location;
        observations.push({
          external_id: Number(observation.id),
          external_service: 'iNaturalist',
          observed_at: observation.time_observed_at,
          location: {
            lat: Number(observation.location.split(',')[0]),
            lng: Number(observation.location.split(',')[1]),
          },
          taxa,
          data,
        });
      }
      if (observations.length > 0) {
        await insertObservations(observationDb, observations);
      }
    }
    return { newObservations };
  }

  return { cleanupOldObs, fetchNewObs };
}

export async function fetchArtenfinderNet(taxa: Taxa) {
  const taxonName: Record<Taxa, string> = {
    'Vespa velutina': 'vespa%velutina',
    'Aethina tumida': 'aethina%tumida',
  };
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - 30);
  const dateTo = new Date();
  const datumVon = `${dateFrom.getDate()}.${dateFrom.getMonth() + 1}.${dateFrom.getFullYear()}`;
  const datumBis = `${dateTo.getDate()}.${dateTo.getMonth() + 1}.${dateTo.getFullYear()}`;
  let url: string | undefined =
    `https://www.artenfinder.net/api/v2/sichtbeobachtungen?titel_wissenschaftlich=${taxonName[taxa]}&datum_von=${datumVon}&datum_bis=${datumBis}`;
  let newObservations = 0;

  // Coordination system is ETRS89/UTM 32N (EPSG:25832), but we need WGS84 (EPSG:4326)
  proj4.defs(
    'EPSG:25832',
    '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  );

  while (url) {
    const response = (await fetch(url)) as any;
    const res = await response.json();
    if (res.length === 0) break;
    if (res?.result?.length === 0) break;
    url = res.next || undefined;
    const batchIds = res.result
      .filter((o: any) => o.lat && o.lon)
      .map((o: any) => Number(o.id));
    const newIds = await filterNewObservationExternalIds(
      observationDb,
      batchIds,
      'Artenfinder.net',
    );

    const observations: ObservationInsert[] = [];
    for (let i = 0; i < res.result.length; i++) {
      const observation = res.result[i];
      if (!observation.lat || !observation.lon) continue;
      if (!newIds.has(Number(observation.id))) continue;

      newObservations++;
      const data = { ...observation };
      delete data.lat;
      delete data.lon;

      data.uri = `https://www.artenfinder.net/artenfinder-pwa/#/beobachtung/${observation.id}`;

      const observed_at = observation.datum.split('.');

      const coordinates = proj4('EPSG:25832', 'EPSG:4326', [
        Number(observation.lon),
        Number(observation.lat),
      ]);

      observations.push({
        external_id: Number(observation.id),
        external_uuid: observation.guid,
        external_service: 'Artenfinder.net',
        observed_at: new Date(
          observed_at[2],
          observed_at[1] - 1,
          observed_at[0],
        ).toISOString(),
        location: {
          lat: coordinates[1],
          lng: coordinates[0],
        },
        taxa,
        data,
      });
    }

    if (observations.length > 0) {
      await insertObservations(observationDb, observations);
    }
  }

  return { newObservations };
}

export function fetchObservationOrg() {
  const SPECIES_ID: Record<Taxa, number> = {
    'Vespa velutina': 8807,
    'Aethina tumida': 789087,
  };
  const BASE_URL = 'https://observation.org/api/v1';

  /**
   * @description Randomly select Observation.org records from database and check if they are still present or have been invalidated
   */
  async function cleanupOldObs() {
    const oldRecords = await getRandomObservationSample(
      observationDb,
      'Observation.org',
      50,
    );
    const notFound: number[] = [];
    const removedExternalIds: number[] = [];

    if (oldRecords.length === 0) {
      return { checked: 0, notFound: 0 };
    }

    for (const record of oldRecords) {
      try {
        const url = `${BASE_URL}/observations/${record.external_id}/?format=json`;
        const response = await fetch(url);
        if (!response.ok) {
          notFound.push(record.id);
          removedExternalIds.push(record.external_id!);
          continue;
        }
        const obs: any = await response.json();
        // Check if the species has been re-identified to something else
        if (obs.species !== SPECIES_ID[record.taxa as Taxa]) {
          notFound.push(record.id);
          removedExternalIds.push(record.external_id!);
        }
      } catch {
        // Skip on network errors, don't remove
      }
    }

    await deleteObservationsByIds(observationDb, notFound);

    return {
      checked: oldRecords.length,
      notFound: notFound.length,
      removedExternalIds,
    };
  }

  async function fetchNewObs(taxa: Taxa) {
    const speciesId = SPECIES_ID[taxa];
    let newObservations = 0;
    const limit = 300;

    const now = new Date();
    const dateAfter = new Date();
    dateAfter.setDate(dateAfter.getDate() - 30);

    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const url = `${BASE_URL}/species/${speciesId}/observations/?format=json&is_validated=true&limit=${limit}&offset=${offset}&date_after=${dateAfter.toISOString().split('T')[0]}&date_before=${now.toISOString().split('T')[0]}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.results || data.results.length === 0) break;

      const batchIds = data.results
        .filter((o: any) => o.point?.coordinates)
        .map((o: any) => o.id);
      const newIds = await filterNewObservationExternalIds(
        observationDb,
        batchIds,
        'Observation.org',
      );

      const observations: ObservationInsert[] = [];
      for (const obs of data.results) {
        if (!obs.point?.coordinates) continue;
        if (!newIds.has(obs.id)) continue;

        newObservations++;

        observations.push({
          external_id: obs.id,
          external_uuid: obs.uuid,
          external_service: 'Observation.org',
          observed_at: obs.time
            ? `${obs.date}T${obs.time}:00Z`
            : `${obs.date}T00:00:00Z`,
          location: {
            lat: obs.point.coordinates[1],
            lng: obs.point.coordinates[0],
          },
          taxa,
          data: {
            individualCount: obs.number,
            lifeStage: obs.life_stage,
            validationStatus: obs.validation_status,
            uri: obs.permalink,
          },
        });
      }

      if (observations.length > 0) {
        await insertObservations(observationDb, observations);
      }

      hasMore = data.next !== null;
      offset += limit;
    }
    return { newObservations };
  }

  return { cleanupOldObs, fetchNewObs };
}

export async function fetchInfoFaunaCh(taxa: Taxa) {
  if (taxa !== 'Aethina tumida') {
    throw new Error(
      'Info Fauna GBIF import is only supported for Aethina tumida',
    );
  }
  const url =
    'https://api.gbif.org/v1/occurrence/search?dataset_key=81981d98-e27f-4155-9a94-9eae9bbad2be&taxon_key=8254044';

  let endOfRecords = false;
  let offset = 0;
  let newObservations = 0;
  const limit = 300;
  const yearFilter = `&year=${
    new Date().getFullYear() - 1
  },${new Date().getFullYear()}`;

  while (!endOfRecords) {
    const result = await fetch(
      `${url}&limit=${limit}&offset=${offset}${yearFilter}`,
    );
    const data = await result.json();
    if (!data.results || data.results.length === 0) break;
    endOfRecords = data.endOfRecords;
    offset += limit;

    const results = data.results;
    const batchIds = results.map((o: any) => Number(o.gbifID));
    const newIds = await filterNewObservationExternalIds(
      observationDb,
      batchIds,
      'Info Fauna (GBIF)',
    );

    const observations: ObservationInsert[] = [];
    for (let i = 0; i < results.length; i++) {
      if (!newIds.has(Number(results[i].gbifID))) {
        continue;
      }
      newObservations++;
      const observation = results[i];
      observations.push({
        external_id: Number(observation.gbifID),
        external_uuid: observation.catalogNumber,
        external_service: 'Info Fauna (GBIF)',
        observed_at: observation.eventDate,
        location: {
          lat: Number(observation.decimalLatitude),
          lng: Number(observation.decimalLongitude),
        },
        taxa,
        data: {
          bibliographicCitation: observation.bibliographicCitation,
          identificationRemarks: observation.identificationRemarks,
          uri: 'https://lepus.infofauna.ch/carto/58510',
        },
      });
    }
    if (observations.length > 0) {
      await insertObservations(observationDb, observations);
    }
  }
  return { newObservations };
}
