import { describe, expect, it } from 'vitest';

import { redactIcalApiKeyFromUrl } from '../../src/services/logger.service.js';

describe('logger', () => {
  it('replaces iCal API keys with stable fingerprints', () => {
    const apiKey = 'calendar-secret-key';
    const url = `/api/v1/external/ical/checkup/${apiKey}?format=ics`;

    const redacted = redactIcalApiKeyFromUrl(url);

    expect(redacted).toMatch(
      /^\/api\/v1\/external\/ical\/checkup\/\[key:[a-f0-9]{12}\]\?format=ics$/,
    );
    expect(redacted).not.toContain(apiKey);
    expect(redactIcalApiKeyFromUrl(url)).toBe(redacted);
  });

  it('leaves unrelated URLs unchanged', () => {
    const url = '/api/v1/status';

    expect(redactIcalApiKeyFromUrl(url)).toBe(url);
  });
});
