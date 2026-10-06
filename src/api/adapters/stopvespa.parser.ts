export interface StopVespaObservation {
  externalUuid: string;
  observedAt: string;
  location: { lat: number; lng: number };
  data: {
    observationType: 'nest' | 'hornet';
    nestType: 'primário' | 'definitivo' | null;
    destroyed: boolean | null;
    destroyedAt: string | null;
    uri: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function dateValue(value: unknown) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value))
    return undefined;
  const date = new Date(value);
  // MariaDB DATETIME cannot represent years before 1000. No research cutoff is used.
  if (
    !Number.isFinite(date.getTime()) ||
    date.getUTCFullYear() < 1000 ||
    value > Date.now()
  )
    return undefined;
  return date.toISOString();
}

export function parseStopVespaPage(payload: unknown) {
  if (
    !isRecord(payload) ||
    'error' in payload ||
    !Array.isArray(payload.features) ||
    payload.geometryType !== 'esriGeometryPoint' ||
    !isRecord(payload.spatialReference) ||
    (payload.spatialReference.latestWkid ?? payload.spatialReference.wkid) !==
      4326 ||
    (payload.exceededTransferLimit !== undefined &&
      typeof payload.exceededTransferLimit !== 'boolean')
  ) {
    throw new Error('Invalid STOPvespa ArcGIS response');
  }
  const records: StopVespaObservation[] = [];
  const objectIds: number[] = [];
  let skippedRecords = 0;
  for (const feature of payload.features) {
    if (!isRecord(feature) || !isRecord(feature.attributes))
      throw new Error('Invalid STOPvespa feature schema');
    const attributes = feature.attributes;
    for (const field of [
      'ObjectId',
      'globalid',
      'data_observ',
      'tipo_observ',
      'tipo',
      'exterminad',
      'data_exter',
    ]) {
      if (!(field in attributes))
        throw new Error(`Missing STOPvespa field: ${field}`);
    }
    // ObjectId is only a pagination cursor, never a persisted observation identity.
    if (
      typeof attributes.ObjectId !== 'number' ||
      !Number.isSafeInteger(attributes.ObjectId) ||
      attributes.ObjectId < 0
    ) {
      throw new Error('Invalid STOPvespa pagination ObjectId');
    }
    objectIds.push(attributes.ObjectId);
    const rawUuid =
      typeof attributes.globalid === 'string' ? attributes.globalid.trim() : '';
    const uuid = (
      /^\{[^{}]+\}$/.test(rawUuid) ? rawUuid.slice(1, -1) : rawUuid
    ).toLowerCase();
    const observedAt = dateValue(attributes.data_observ);
    const geometry = feature.geometry;
    const type = attributes.tipo_observ;
    if (
      !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/.test(uuid) ||
      uuid === '00000000-0000-0000-0000-000000000000' ||
      !observedAt ||
      (type !== 'ninho' && type !== 'vespa') ||
      !isRecord(geometry) ||
      typeof geometry.x !== 'number' ||
      typeof geometry.y !== 'number' ||
      !Number.isFinite(geometry.x) ||
      !Number.isFinite(geometry.y) ||
      geometry.x < -180 ||
      geometry.x > 180 ||
      geometry.y < -90 ||
      geometry.y > 90 ||
      (geometry.x === 0 && geometry.y === 0)
    ) {
      skippedRecords++;
      continue;
    }
    const nestType = attributes.tipo;
    const destroyed = attributes.exterminad;
    const destroyedAt =
      attributes.data_exter == null ? null : dateValue(attributes.data_exter);
    if (
      (nestType !== null &&
        nestType !== 'primário' &&
        nestType !== 'definitivo') ||
      (destroyed !== null && destroyed !== 'sim' && destroyed !== 'não') ||
      destroyedAt === undefined ||
      (destroyedAt !== null &&
        (destroyed !== 'sim' || destroyedAt < observedAt))
    ) {
      skippedRecords++;
      continue;
    }
    records.push({
      externalUuid: uuid,
      observedAt,
      location: { lat: geometry.y, lng: geometry.x },
      data: {
        observationType: type === 'ninho' ? 'nest' : 'hornet',
        nestType:
          nestType === 'primário' || nestType === 'definitivo'
            ? nestType
            : null,
        destroyed: destroyed === null ? null : destroyed === 'sim',
        destroyedAt,
        uri: 'https://stopvespa.icnf.pt/geovisualizador/',
      },
    });
  }
  return {
    records,
    objectIds,
    skippedRecords,
    exceededTransferLimit: payload.exceededTransferLimit === true,
  };
}
