import type { Taxa } from '../models/observation.model.js';
import proj4 from 'proj4';
import { RedisServer } from '../../servers/redis.server.js';
import { buildRedisCacheKeyObservationsRecent } from '../controllers/public.controller.js';
import { Observation } from '../models/observation.model.js';

export async function fetchObservations(taxa: Taxa = 'Vespa velutina') {
  const fInat = fetchInat();
  const fObservation = fetchObservationOrg();

  const cleanupInat = await fInat.cleanupOldObs();
  const cleanupObservationOrg = await fObservation.cleanupOldObs();

  const inat = await fInat.fetchNewObs(taxa);
  const observationOrg = await fObservation.fetchNewObs(taxa);
  const artenfinderNet = await fetchArtenfinderNet(taxa);
  const infoFaunaCh = await fetchInfoFaunaCh(taxa);

  const patriNat
    = taxa === 'Vespa velutina' ? await fetchPatriNat() : { newObservations: 0 };

  /** after fetching new taxa we want to cleanup any possible cached map results */
  const cacheKey = buildRedisCacheKeyObservationsRecent(taxa);
  RedisServer.client.del(cacheKey);

  return {
    taxa,
    iNaturalist: inat,
    patriNat,
    artenfinderNet,
    observationOrg,
    infoFaunaCh,
    cleanup: {
      iNaturalist: cleanupInat,
      ObservationOrg: cleanupObservationOrg,
    },
  };
}

interface ObservationPatriNat {
  nom_station: string
  loc_lat: string
  loc_long: string
  observateur: string
  validation: string
  commentaires_validation: string
  uri?: string
}

export async function fetchPatriNat() {
  // Example Input: Rome07072015033744
  function dateExtract(t: string) {
    const e = t.substring(t.length - 14);
    const day = e.substring(0, 2);
    const month = e.substring(2, 4);
    const year = e.substring(4, 8);
    const hour = e.substring(8, 10);
    const minute = e.substring(10, 12);
    const second = e.substring(12, 14);
    return new Date(
      `${year
      }-${
        month
      }-${
        day
      }T${
        hour
      }:${
        minute
      }:${
        second
      }Z`,
    );
  }
  const result = await fetch(
    'https://frelonasiatique.mnhn.fr/wp-content/plugins/spn_csv_exporter/widgetVisualisateur/visuaMapDisplayController.php',
    {
      headers: {
        Referer: 'https://www.btree.at/',
      },
      method: 'GET',
    },
  );
  const data = await result.json();
  const observations = [];
  if (!data.records) {
    return { newObservations: 0 };
  }

  const oldRecords = await Observation.query()
    .select('external_uuid')
    .where('external_service', 'PatriNat');
  const searchArray = oldRecords.map(o => o.external_uuid);

  for (let i = 0; i < data.records.length; i++) {
    const observation: ObservationPatriNat = data.records[i];
    if (observation.validation !== 'Validé')
      continue;
    if (searchArray.includes(observation.nom_station)) {
      continue;
    }
    const date = dateExtract(observation.nom_station);
    observation.uri = 'https://frelonasiatique.mnhn.fr/visualisateur';
    observations.push({
      external_uuid: observation.nom_station,
      external_service: 'PatriNat',
      observed_at: date.toISOString(),
      location: {
        lat: Number(observation.loc_lat),
        lng: Number(observation.loc_long),
      },
      taxa: 'Vespa velutina',
      data: observation,
    });
  }

  if (observations.length === 0)
    return { newObservations: 0 };

  await Observation.query().insertGraph(observations);

  return { newObservations: observations.length };
}

export function fetchInat() {
  const URL = 'https://api.inaturalist.org/v2/observations';
  const TAXON_IDS: Record<Taxa, number[]> = {
    'Vespa velutina': [119019, 560197], // Vespa velutina and Vespa velutina nigrithorax
    'Aethina tumida': [457066],
  };
  const FIELDS
    = '(id:!t,uri:!t,quality_grade:!t,time_observed_at:!t,location:!t,taxon:(id:!t))';

  /**
   * @description Randomly select 200 iNat observation from database and check if they are still present and also the correct taxon
   */
  async function cleanupOldObs() {
    const oldRecords = await Observation.query()
      .where('external_service', 'iNaturalist')
      .whereNotNull('external_id')
      .orderByRaw('RAND()')
      .limit(200); // must be same as limit of per_page
    const notFound = [];
    const wrongTaxon = [];
    const removedExternalIds = [];

    const ids = oldRecords.map(o => o.external_id).join(',');
    if (ids.length === 0) {
      return { checked: 0, notFound: 0, wrongTaxon: 0 };
    }

    const url = `${URL}?id=${ids}&fields=${FIELDS}&per_page=200`;
    const response = await fetch(url);
    const res = await response.json();

    const foundIds = res.results.map((o: any) => o.id);
    for (let i = 0; i < oldRecords.length; i++) {
      const record = oldRecords[i];
      if (!foundIds.includes(record.external_id)) {
        notFound.push(record.id);
        removedExternalIds.push(record.external_id);
      }
      else {
        const observation = res.results.find((o: any) => o.id === record.external_id);
        if (TAXON_IDS[record.taxa].includes(observation.taxon.id) === false) {
          wrongTaxon.push(record.id);
          removedExternalIds.push(record.external_id);
        }
      }
    }

    const deleteQuery = Observation.query();
    if (notFound.length > 0) {
      deleteQuery.whereIn('id', notFound);
    }
    if (wrongTaxon.length > 0) {
      deleteQuery.orWhereIn('id', wrongTaxon);
    }
    if (notFound.length > 0 || wrongTaxon.length > 0) {
      await deleteQuery.delete();
    }

    return { checked: oldRecords.length, notFound: notFound.length, wrongTaxon: wrongTaxon.length, removedExternalIds };
  }

  async function fetchNewObs(taxa: Taxa, monthsBefore = 6) {
    let idAbove = 1;
    let newObservations = 0;
    let createdAtD1: Date | string = new Date();
    createdAtD1.setMonth(createdAtD1.getMonth() - monthsBefore);
    createdAtD1 = createdAtD1.toISOString().split('T')[0];
    const createdAtD2 = new Date().toISOString().split('T')[0];

    const oldRecords = await Observation.query()
      .select('external_id')
      .where('external_service', 'iNaturalist');
    const searchArray = oldRecords.map(o => o.external_id);

    while (idAbove > 0) {
      const url = `${URL}?taxon_id=${TAXON_IDS[taxa].join(',')}&verifiable=true&quality_grade=research&order=asc&order_by=id&per_page=200&fields=${FIELDS}&created_d1=${createdAtD1}&created_d2=${createdAtD2}&id_above=${idAbove}`;
      const response = await fetch(url);
      const res = await response.json();
      const observations = [];
      if (res.results.length === 0)
        break;
      idAbove = res.results[res.results.length - 1].id;
      // newObservations += data.results.length;
      for (let i = 0; i < res.results.length; i++) {
        const observation = res.results[i];
        if (!observation.time_observed_at)
          continue;
        if (!observation.location)
          continue;
        if (searchArray.includes(observation.id)) {
          continue;
        }
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
      await Observation.query().insertGraph(observations);
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
  let url = `https://www.artenfinder.net/api/v2/sichtbeobachtungen?titel_wissenschaftlich=${taxonName[taxa]}`;
  let newObservations = 0;

  const oldRecords = await Observation.query()
    .select('external_id')
    .where('external_service', 'Artenfinder.net');
  const searchArray = oldRecords.map(o => o.external_id);

  // Coordination system is ETRS89/UTM 32N (EPSG:25832), but we need WGS84 (EPSG:4326)
  proj4.defs(
    'EPSG:25832',
    '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  );

  while (url) {
    const response = await fetch(url);
    const res = await response.json();
    if (res.length === 0)
      break;
    if (res?.result?.length === 0)
      break;
    url = res.next || undefined;
    const observations = [];
    for (let i = 0; i < res.result.length; i++) {
      const observation = res.result[i];
      if (!observation.lat || !observation.lon)
        continue;
      if (searchArray.includes(observation.id))
        continue;

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

    await Observation.query().insertGraph(observations);
  }

  if (newObservations === 0)
    return { newObservations: 0 };

  return { newObservations };
}

export function fetchObservationOrg() {
  const TAXON_KEY: Record<Taxa, number> = {
    'Vespa velutina': 1311477,
    'Aethina tumida': 8254044,
  };
  const BASE_URL = 'https://api.gbif.org/v1/occurrence/search';
  const DATASET_KEY = '8a863029-f435-446a-821e-275f4f641165';

  /**
   * @description Randomly select Observation.org records from database and check if they are still present
   */
  async function cleanupOldObs() {
    const oldRecords = await Observation.query()
      .where('external_service', 'Observation.org')
      .whereNotNull('external_id')
      .orderByRaw('RAND()')
      .limit(50);
    const notFound = [];
    const removedExternalIds = [];

    if (oldRecords.length === 0) {
      return { checked: 0, notFound: 0 };
    }

    const gbifIds = oldRecords.map(o => o.data?.uri).join('&occurrenceId=');
    const url = `${BASE_URL}?dataset_key=${DATASET_KEY}&occurrenceId=${gbifIds}&limit=50`;
    console.log(url);
    const response = await fetch(url);
    const res = await response.json();

    const foundIds = res.results.map((o: any) => Number(o.gbifID));
    for (const record of oldRecords) {
      if (!foundIds.includes(record.external_id)) {
        console.log(`Removing Observation.org record with id ${record.external_id} as it was not found anymore in GBIF. ${record.data?.uri}`);
        notFound.push(record.id);
        removedExternalIds.push(record.external_id);
      }
    }

    if (notFound.length > 0) {
      await Observation.query().whereIn('id', notFound).delete();
    }

    return { checked: oldRecords.length, notFound: notFound.length, removedExternalIds };
  }

  async function fetchNewObs(taxa: Taxa) {
    const url = `${BASE_URL}?dataset_key=${DATASET_KEY}&taxon_key=${TAXON_KEY[taxa]}`;

    let endOfRecords = false;
    let offset = 0;
    let newObservations = 0;
    const limit = 300;
    let yearFilter = `&year=${
      new Date().getFullYear() - 1
    },${new Date().getFullYear()}`;

    const oldRecords = await Observation.query()
      .select('external_id')
      .where('external_service', 'Observation.org');
    const searchArray = oldRecords.map(o => o.external_id);

    if (searchArray.length === 0)
      yearFilter = '';

    while (endOfRecords === false) {
      const result = await fetch(
        `${url}&limit=${limit}&offset=${offset}${yearFilter}`,
      );
      const data = await result.json();
      if (data.results.length === 0)
        break;
      endOfRecords = data.endOfRecords;
      offset += limit;

      const observations = [];
      const results = data.results;
      for (let i = 0; i < results.length; i++) {
        if (searchArray.includes(Number(results[i].gbifID))) {
          continue;
        }
        newObservations++;
        const observation = results[i];
        observations.push({
          external_id: Number(observation.gbifID),
          external_uuid: observation.catalogNumber,
          external_service: 'Observation.org',
          observed_at: observation.eventDate,
          location: {
            lat: Number(observation.decimalLatitude),
            lng: Number(observation.decimalLongitude),
          },
          taxa,
          data: {
            individualCount: observation.individualCount,
            lifeStage: observation.lifeStage,
            uri: observation.occurrenceID,
          },
        });
      }
      await Observation.query().insertGraph(observations);
    }
    return { newObservations };
  }

  return { cleanupOldObs, fetchNewObs };
}

export async function fetchInfoFaunaCh(taxa: Taxa) {
  const taxonKey: Record<Taxa, number> = {
    'Vespa velutina': 1311477,
    'Aethina tumida': 8254044,
  };
  const url = `https://api.gbif.org/v1/occurrence/search?dataset_key=81981d98-e27f-4155-9a94-9eae9bbad2be&taxon_key=${taxonKey[taxa]}`;

  let endOfRecords = false;
  let offset = 0;
  let newObservations = 0;
  const limit = 300;
  let yearFilter = `&year=${
    new Date().getFullYear() - 1
  },${new Date().getFullYear()}`;
  const oldRecords = await Observation.query()
    .select('external_id')
    .where('external_service', 'Info Fauna (GBIF)');
  const searchArray = oldRecords.map(o => o.external_id);

  if (searchArray.length === 0)
    yearFilter = '';

  while (endOfRecords === false) {
    const result = await fetch(
      `${url}&limit=${limit}&offset=${offset}${yearFilter}`,
    );
    const data = await result.json();
    if (data.results.length === 0)
      break;
    endOfRecords = data.endOfRecords;
    offset += limit;

    const observations = [];
    const results = data.results;
    for (let i = 0; i < results.length; i++) {
      if (searchArray.includes(Number(results[i].gbifID))) {
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
    await Observation.query().insertGraph(observations);
  }
  return { newObservations };
}
