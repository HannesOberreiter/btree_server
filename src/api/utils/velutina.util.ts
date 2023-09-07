import { Observation } from '../models/observation.model.js';
import proj4 from 'proj4';

export async function fetchObservations() {
  const inat = fetchInat();
  const patriNat = fetchPatriNat();
  const artenfinderNet = fetchArtenfinderNet();
  const [inatResult, patriNatResult, artenfinderNetResult] = await Promise.all([
    inat,
    patriNat,
    artenfinderNet,
  ]);
  return {
    iNaturalist: inatResult,
    patriNat: patriNatResult,
    artenfinderNet: artenfinderNetResult,
  };
}

type ObservationPatriNat = {
  nom_station: string;
  loc_lat: string;
  loc_long: string;
  observateur: string;
  validation: string;
  commentaires_validation: string;
};

export async function fetchPatriNat() {
  // Example Input: Rome07072015033744
  function dateExtract(t: string) {
    const e = t.substring(t.length - 14),
      day = e.substring(0, 2),
      month = e.substring(2, 4),
      year = e.substring(4, 8),
      hour = e.substring(8, 10),
      minute = e.substring(10, 12),
      second = e.substring(12, 14);
    return new Date(
      year +
        '-' +
        month +
        '-' +
        day +
        'T' +
        hour +
        ':' +
        minute +
        ':' +
        second +
        'Z',
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
  const searchArray = oldRecords.map((o) => o.external_uuid);

  for (let i = 0; i < data.records.length; i++) {
    const observation: ObservationPatriNat = data.records[i];
    if (observation.validation != 'Validé') continue;
    if (searchArray.includes(observation.nom_station)) {
      continue;
    }
    const date = dateExtract(observation.nom_station);
    observation['uri'] = 'https://frelonasiatique.mnhn.fr/visualisateur';
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

  if (observations.length === 0) return { newObservations: 0 };

  await Observation.query().insertGraph(observations);

  return { newObservations: observations.length };
}

export async function fetchInat(monthsBefore = 6) {
  const fields =
    '(id:!t,uri:!t,quality_grade:!t,time_observed_at:!t,location:!t,taxon:(id:!t))';

  let idAbove = 1;
  let newObservations = 0;
  let createdAtD1: Date | string = new Date();
  createdAtD1.setMonth(createdAtD1.getMonth() - monthsBefore);
  createdAtD1 = createdAtD1.toISOString().split('T')[0];
  const createdAtD2 = new Date().toISOString().split('T')[0];

  const oldRecords = await Observation.query()
    .select('external_id')
    .where('external_service', 'iNaturalist');
  const searchArray = oldRecords.map((o) => o.external_id);

  while (idAbove > 0) {
    const url = `https://api.inaturalist.org/v2/observations?taxon_id=119019&verifiable=true&quality_grade=research&order=asc&order_by=id&per_page=200&fields=${fields}&created_d1=${createdAtD1}&created_d2=${createdAtD2}&id_above=${idAbove}`;
    const response = await fetch(url);
    const res = await response.json();
    let observations = [];
    if (res.results.length === 0) break;
    idAbove = res.results[res.results.length - 1].id;
    // newObservations += data.results.length;
    for (let i = 0; i < res.results.length; i++) {
      const observation = res.results[i];
      if (!observation.time_observed_at) continue;
      if (!observation.location) continue;
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
        taxa: 'Vespa velutina',
        data: data,
      });
    }
    await Observation.query().insertGraph(observations);
  }
  return { newObservations: newObservations };
}

export async function fetchArtenfinderNet() {
  const oldRecords = await Observation.query()
    .select('external_id')
    .where('external_service', 'Artenfinder.net');
  const searchArray = oldRecords.map((o) => o.external_id);

  let url =
    'https://www.artenfinder.net/api/v2/sichtbeobachtungen?titel_wissenschaftlich=vespa%velutina';

  let newObservations = 0;

  // Coordination system is ETRS89/UTM 32N (EPSG:25832), but we need WGS84 (EPSG:4326)
  proj4.defs(
    'EPSG:25832',
    '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  );

  while (url) {
    const response = await fetch(url);
    const res = await response.json();
    if (res.length === 0) break;
    if (res?.result?.length === 0) break;
    url = res.next || undefined;
    let observations = [];
    for (let i = 0; i < res.result.length; i++) {
      const observation = res.result[i];
      if (!observation.lat || !observation.lon) continue;
      if (searchArray.includes(observation.id)) continue;

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
        taxa: 'Vespa velutina',
        data: data,
      });
    }

    await Observation.query().insertGraph(observations);
  }

  if (newObservations === 0) return { newObservations: 0 };

  return { newObservations: newObservations };
}
