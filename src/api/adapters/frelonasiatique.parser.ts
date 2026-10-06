export type FrelonasiatiqueObservationType =
  | 'hornet'
  | 'nest'
  | 'hornet_and_nest';

export interface FrelonasiatiqueObservation {
  externalId: number;
  observedAt: string;
  location: {
    lat: number;
    lng: number;
  };
  observationType: FrelonasiatiqueObservationType;
  canton: string;
  municipality: string;
  nestState: string;
}

const OBSERVATION_TYPES = new Set<FrelonasiatiqueObservationType>([
  'hornet',
  'nest',
  'hornet_and_nest',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseDate(value: unknown) {
  if (typeof value !== 'string') return;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return;
  }
  return date.toISOString();
}

function parseFeature(
  value: unknown,
  index: number,
): FrelonasiatiqueObservation {
  if (!isRecord(value) || value.type !== 'Feature') {
    throw new Error(`Invalid frelonasiatique.ch observation at index ${index}`);
  }
  const geometry = value.geometry;
  const properties = value.properties;
  if (
    !isRecord(geometry) ||
    geometry.type !== 'Point' ||
    !Array.isArray(geometry.coordinates) ||
    geometry.coordinates.length < 2 ||
    !isRecord(properties)
  ) {
    throw new Error(`Invalid frelonasiatique.ch observation at index ${index}`);
  }

  const [lng, lat] = geometry.coordinates;
  const externalId = properties.observation_id;
  const observedAt = parseDate(properties.observation_date);
  const observationType = properties.observation_type;
  if (
    typeof lat !== 'number' ||
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    typeof lng !== 'number' ||
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180 ||
    typeof externalId !== 'number' ||
    !Number.isSafeInteger(externalId) ||
    externalId <= 0 ||
    !observedAt ||
    typeof observationType !== 'string' ||
    !OBSERVATION_TYPES.has(observationType as FrelonasiatiqueObservationType) ||
    typeof properties.canton !== 'string' ||
    typeof properties.municipality !== 'string' ||
    typeof properties.nest_state !== 'string'
  ) {
    throw new Error(`Invalid frelonasiatique.ch observation at index ${index}`);
  }

  return {
    externalId,
    observedAt,
    location: { lat, lng },
    observationType: observationType as FrelonasiatiqueObservationType,
    canton: properties.canton,
    municipality: properties.municipality,
    nestState: properties.nest_state,
  };
}

export function parseFrelonasiatiqueObservations(
  value: unknown,
): FrelonasiatiqueObservation[] {
  if (
    !isRecord(value) ||
    value.type !== 'FeatureCollection' ||
    !Array.isArray(value.features)
  ) {
    throw new Error('Invalid frelonasiatique.ch response');
  }

  const observations = value.features.map(parseFeature);
  const ids = new Set<number>();
  for (const observation of observations) {
    if (ids.has(observation.externalId)) {
      throw new Error(
        `Duplicate frelonasiatique.ch observation ID ${observation.externalId}`,
      );
    }
    ids.add(observation.externalId);
  }
  return observations;
}
