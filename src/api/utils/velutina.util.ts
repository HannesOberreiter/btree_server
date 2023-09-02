import { Observation } from '../models/observation.model.js';

export async function fetchObservations() {
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
