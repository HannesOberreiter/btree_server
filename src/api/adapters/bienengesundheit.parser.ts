interface BienengesundheitPoint {
  id: number;
  x: number;
  y: number;
  description: string;
  region_id?: number;
}

export interface BienengesundheitObservation {
  externalId: number;
  observedAt: string;
  location: {
    lat: number;
    lng: number;
  };
  region?: string;
  regionId?: number;
  reportType?: string;
}

const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  quot: '"',
};

function decodeCodePoint(entity: string, codePoint: number) {
  return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
    ? String.fromCodePoint(codePoint)
    : entity;
}

function decodeHtmlEntities(value: string) {
  return value.replace(
    /&(#x[\da-f]+|#\d+|amp|apos|gt|lt|quot);/gi,
    (entity, encoded: string) => {
      const normalized = encoded.toLowerCase();
      if (normalized.startsWith('#x')) {
        return decodeCodePoint(
          entity,
          Number.parseInt(normalized.slice(2), 16),
        );
      }
      if (normalized.startsWith('#')) {
        return decodeCodePoint(
          entity,
          Number.parseInt(normalized.slice(1), 10),
        );
      }
      return NAMED_HTML_ENTITIES[normalized] ?? entity;
    },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function toPoint(value: unknown): BienengesundheitPoint | undefined {
  if (!isRecord(value)) return;

  const id = toFiniteNumber(value.id);
  const lat = toFiniteNumber(value.x);
  const lng = toFiniteNumber(value.y);
  if (
    id === undefined ||
    lat === undefined ||
    lng === undefined ||
    typeof value.description !== 'string' ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return;
  }

  return {
    id,
    x: lat,
    y: lng,
    description: value.description,
    region_id: toFiniteNumber(value.region_id),
  };
}

function findPoints(value: unknown, points: BienengesundheitPoint[]) {
  const point = toPoint(value);
  if (point) {
    points.push(point);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) findPoints(item, points);
    return;
  }

  if (isRecord(value)) {
    for (const item of Object.values(value)) findPoints(item, points);
  }
}

function parseObservedAt(description: string) {
  const match = description.match(/Beobachtet:\s*(\d{2})\.(\d{2})\.(\d{4})/i);
  if (!match) return;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
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

function extractText(description: string, pattern: RegExp) {
  return description.match(pattern)?.[1]?.trim();
}

export function parseBienengesundheitObservations(html: string) {
  const observations = new Map<number, BienengesundheitObservation>();
  const snapshots = html.matchAll(/\bwire:snapshot\s*=\s*"([^"]*)"/g);

  for (const match of snapshots) {
    let snapshot: unknown;
    try {
      snapshot = JSON.parse(decodeHtmlEntities(match[1]));
    } catch {
      continue;
    }
    if (!isRecord(snapshot) || !isRecord(snapshot.data)) continue;

    const points: BienengesundheitPoint[] = [];
    findPoints(snapshot.data.points, points);
    for (const point of points) {
      const observedAt = parseObservedAt(point.description);
      if (!observedAt) continue;

      observations.set(point.id, {
        externalId: point.id,
        observedAt,
        location: {
          lat: point.x,
          lng: point.y,
        },
        region: extractText(point.description, /<b>\s*([^<]+?)\s*<\/b>/i),
        regionId: point.region_id,
        reportType: extractText(point.description, /Art:\s*([^<]+?)\s*<\/td>/i),
      });
    }
  }

  return [...observations.values()];
}
