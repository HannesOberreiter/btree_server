import { Observation } from '../models/observation.model.js';

export async function fetchObservations() {
  const inat = fetchInat();
  const patriNat = fetchPatriNat();
  const [inatResult, patriNatResult] = await Promise.all([inat, patriNat]);
  return { iNaturalist: inatResult, patriNat: patriNatResult };
}

type ObservationPatriNat = {
  nom_station: string;
  loc_lat: string;
  loc_long: string;
  observateur: string;
  validation: string;
  commentaires_validation: string;
};

async function fetchPatriNat() {
  // Example Input: Rome07072015033744
  function dateExtract(t: string) {
    const e = t.substring(t.length - 14),
      day = e.substring(0, 2),
      month = e.substring(2, 4),
      year = e.substring(4, 8);
    return new Date(year + '-' + month + '-' + day);
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

  for (const observation of data.records as ObservationPatriNat[]) {
    if (observation.validation != 'Validé') continue;
    const date = dateExtract(observation.nom_station);
    if (oldRecords.find((o) => o.external_uuid === observation.nom_station))
      continue;
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

  //await Observation.query().insertGraph(observations);
  return { newObservations: observations.length };
}

async function fetchInat() {
  const fields =
    '(id:!t,uri:!t,quality_grade:!t,time_observed_at:!t,location:!t,taxon:(id:!t))';

  const latestId = await Observation.query()
    .max('external_id as external_id')
    .where('external_service', 'iNaturalist')
    .first();

  let idAbove = +(latestId.external_id ?? 1);

  let newObservations = 0;

  while (idAbove > 0) {
    const url = `https://api.inaturalist.org/v2/observations?taxon_id=119019&verifiable=true&quality_grade=research&order=asc&order_by=id&per_page=200&fields=${fields}&id_above=${idAbove}`;

    const response = await fetch(url);
    const data = await response.json();
    let observations = [];
    if (data.results.length === 0) break;
    idAbove = data.results[data.results.length - 1].id;
    newObservations += data.results.length;
    for (const observation of data.results) {
      if (!observation.time_observed_at) continue;
      if (!observation.location) continue;
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
