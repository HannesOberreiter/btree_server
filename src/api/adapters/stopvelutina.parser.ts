export interface StopVelutinaMarker {
  externalId: number;
  year: number;
  observationType: 'nest' | 'hornet';
  location: { lat: number; lng: number };
}

/** Read literal calls only. Provider JavaScript is never evaluated. */
export function parseStopVelutinaMarkers(html: string) {
  const records = new Map<number, StopVelutinaMarker>();
  let skippedRecords = 0;
  let calls = 0;
  for (const match of html.matchAll(/\blsmk\s*\(([^()]*)\)/g)) {
    // The page also contains the function declaration.
    if (/^\s*lat\s*,\s*long\s*,/.test(match[1])) continue;
    calls++;
    const args = match[1].split(',').map((value) => value.trim());
    if (
      args.length !== 5 ||
      args.some((value) => !/^-?\d+(?:\.\d+)?$/.test(value))
    ) {
      skippedRecords++;
      continue;
    }
    const [lat, lng, externalId, shortYear, type] = args.map(Number);
    if (
      !Number.isSafeInteger(externalId) ||
      externalId <= 0 ||
      !Number.isInteger(shortYear) ||
      shortYear < 0 ||
      shortYear > 99 ||
      2000 + shortYear > new Date().getUTCFullYear() ||
      (type !== 1 && type !== 2) ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180 ||
      (lat === 0 && lng === 0)
    ) {
      skippedRecords++;
      continue;
    }
    const marker: StopVelutinaMarker = {
      externalId,
      year: 2000 + shortYear,
      observationType: type === 1 ? 'nest' : 'hornet',
      location: { lat, lng },
    };
    const previous = records.get(externalId);
    if (previous && JSON.stringify(previous) !== JSON.stringify(marker)) {
      throw new Error('Conflicting Stop Velutina marker identity');
    }
    records.set(externalId, marker);
  }
  if (calls === 0) throw new Error('Stop Velutina map has no marker calls');
  return { records: [...records.values()], skippedRecords };
}

export function parseStopVelutinaDetailDate(html: string, year: number) {
  const text = html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;|&#xA0;/gi, ' ');
  const dates = [
    ...text.matchAll(/\bData\s*:\s*(\d{2})\/(\d{2})\/(\d{4})\b/gi),
  ];
  if (dates.length !== 1) return undefined;
  const [, dayText, monthText, yearText] = dates[0];
  const day = Number(dayText);
  const month = Number(monthText);
  const date = new Date(Date.UTC(Number(yearText), month - 1, day));
  if (
    Number(yearText) !== year ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getTime() > Date.now()
  )
    return undefined;
  return date.toISOString();
}
