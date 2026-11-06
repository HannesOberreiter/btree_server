import { DropboxAuth } from 'dropbox';
import type { Kysely } from 'kysely';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getDropboxAuthorizationUrl,
  getDropboxToken,
} from '../../src/api/adapters/dropbox.adapter.js';
import {
  getDropboxTokens,
  updateDropboxTokens,
} from '../../src/api/modules/dropbox.module.js';
import type { DB } from '../../src/types/db.types.js';

vi.mock('../../src/config/environment.config.js', () => ({
  dropboxClientId: 'test-client',
  dropboxClientSecret: 'test-secret',
  frontend: 'https://frontend.example',
}));

vi.mock('../../src/api/modules/dropbox.module.js', () => ({
  getDropboxTokens: vi.fn(),
  updateDropboxTokens: vi.fn(),
  saveDropboxTokens: vi.fn(),
  deleteDropboxTokens: vi.fn(),
}));

// The adapter only passes this handle to the mocked persistence operations.
const db = {} as Kysely<DB>;
const companyId = 42;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getDropboxTokens).mockResolvedValue({
    accessToken: 'stored-access-token',
    refreshToken: 'stored-refresh-token',
  });
  vi.mocked(updateDropboxTokens).mockResolvedValue(1);
});

afterEach(() => vi.restoreAllMocks());

describe('Dropbox token adapter', () => {
  it('returns no token and does not refresh when no credentials are stored', async () => {
    vi.mocked(getDropboxTokens).mockResolvedValue(null);
    const refresh = vi.spyOn(DropboxAuth.prototype, 'refreshAccessToken');

    await expect(getDropboxToken(db, companyId)).resolves.toEqual({});

    expect(getDropboxTokens).toHaveBeenCalledWith(db, companyId);
    expect(refresh).not.toHaveBeenCalled();
    expect(updateDropboxTokens).not.toHaveBeenCalled();
  });

  it('waits for refresh, persists credentials in the same company, and returns the refreshed token', async () => {
    const refresh = vi
      .spyOn(DropboxAuth.prototype, 'refreshAccessToken')
      .mockImplementation(async function (this: DropboxAuth) {
        await Promise.resolve();
        this.setAccessToken('refreshed-access-token');
      });

    await expect(getDropboxToken(db, companyId)).resolves.toEqual({
      token: 'refreshed-access-token',
    });

    expect(refresh).toHaveBeenCalledOnce();
    expect(getDropboxTokens).toHaveBeenCalledWith(db, companyId);
    expect(updateDropboxTokens).toHaveBeenCalledExactlyOnceWith(db, companyId, {
      accessToken: 'refreshed-access-token',
      refreshToken: 'stored-refresh-token',
    });
  });

  it('returns the stored token without writing when refresh leaves it unchanged', async () => {
    vi.spyOn(DropboxAuth.prototype, 'refreshAccessToken').mockResolvedValue();

    await expect(getDropboxToken(db, companyId)).resolves.toEqual({
      token: 'stored-access-token',
    });

    expect(updateDropboxTokens).not.toHaveBeenCalled();
  });

  it('propagates refresh failures without returning stale credentials or writing them', async () => {
    const error = new Error('Dropbox refresh failed');
    const failure = Promise.reject(error);
    // Avoid an unhandled rejection when exercising the pre-fix fire-and-forget path.
    void failure.catch(() => undefined);
    vi.spyOn(DropboxAuth.prototype, 'refreshAccessToken').mockReturnValue(
      failure,
    );

    await expect(getDropboxToken(db, companyId)).rejects.toBe(error);

    expect(updateDropboxTokens).not.toHaveBeenCalled();
  });

  it('propagates persistence failures instead of reporting token refresh success', async () => {
    vi.spyOn(DropboxAuth.prototype, 'refreshAccessToken').mockImplementation(
      async function (this: DropboxAuth) {
        await Promise.resolve();
        this.setAccessToken('refreshed-access-token');
      },
    );
    const error = new Error('Token persistence failed');
    vi.mocked(updateDropboxTokens).mockRejectedValue(error);

    await expect(getDropboxToken(db, companyId)).rejects.toBe(error);
  });

  it('returns the authorization URL with the configured callback and offline access', async () => {
    const { url } = await getDropboxAuthorizationUrl();
    const parsed = new URL(url);

    expect(parsed.origin).toBe('https://dropbox.com');
    expect(parsed.pathname).toBe('/oauth2/authorize');
    expect(parsed.searchParams.get('client_id')).toBe('test-client');
    expect(parsed.searchParams.get('redirect_uri')).toBe(
      'https://frontend.example/setting/dropbox',
    );
    expect(parsed.searchParams.get('token_access_type')).toBe('offline');
  });
});
