import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GoogleAuth } from '../../src/services/federated.service.js';

const google = vi.hoisted(() => ({
  getToken: vi.fn(),
  verifyIdToken: vi.fn(),
  getPayload: vi.fn(),
  selectFrom: vi.fn(),
}));

vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    getToken = google.getToken;
    verifyIdToken = google.verifyIdToken;
  },
}));
vi.mock('../../src/config/environment.config.js', () => ({
  googleOAuth: { clientID: 'test-client', clientSecret: 'test-secret' },
  appleOAuth: {},
  env: 'test',
  url: 'https://api.example.test',
}));
vi.mock('../../src/servers/kysely.server.js', () => ({
  KyselyServer: {
    getInstance: () => ({ db: { selectFrom: google.selectFrom } }),
  },
}));
vi.mock('../../src/services/logger.service.js', () => ({
  Logger: { getInstance: () => ({ log: vi.fn() }) },
}));

beforeEach(() => {
  vi.resetAllMocks();
  google.getToken.mockResolvedValue({ tokens: { id_token: 'test-id-token' } });
  google.verifyIdToken.mockResolvedValue({ getPayload: google.getPayload });
});

describe('Google OAuth nullable responses', () => {
  it.each([undefined, null, ''])(
    'rejects a missing ID token (%s) before verification or account lookup',
    async (idToken) => {
      google.getToken.mockResolvedValue({ tokens: { id_token: idToken } });

      await expect(GoogleAuth.getInstance().verify('code')).rejects.toThrow(
        'No ID token received from Google',
      );
      expect(google.verifyIdToken).not.toHaveBeenCalled();
      expect(google.selectFrom).not.toHaveBeenCalled();
    },
  );

  it.each([
    undefined,
    { sub: 'google-subject' },
    { sub: 'google-subject', email: '' },
  ])('rejects missing identity data before account lookup', async (payload) => {
    google.getPayload.mockReturnValue(payload);

    await expect(GoogleAuth.getInstance().verify('code')).rejects.toThrow(
      'Missing email in Google ID token',
    );
    expect(google.verifyIdToken).toHaveBeenCalledWith({
      idToken: 'test-id-token',
      audience: 'test-client',
    });
    expect(google.selectFrom).not.toHaveBeenCalled();
  });
});
