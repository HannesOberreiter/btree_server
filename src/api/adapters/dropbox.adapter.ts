import { Dropbox, DropboxAuth } from 'dropbox';
import httpErrors from 'http-errors';
import type { Kysely } from 'kysely';

import {
  dropboxClientId,
  dropboxClientSecret,
  frontend,
} from '../../config/environment.config.js';
import type { DB } from '../../types/db.types.js';
import {
  deleteDropboxTokens,
  getDropboxTokens,
  saveDropboxTokens,
  updateDropboxTokens,
} from '../modules/dropbox.module.js';
import { dropboxTokenResultSchema } from '../schemas/dropbox.schema.js';

const config = {
  clientId: dropboxClientId,
  clientSecret: dropboxClientSecret,
};
const redirect = `${frontend}/setting/dropbox`;

export async function getDropboxAuthorizationUrl() {
  const dbx = new DropboxAuth(config);
  const url = await dbx.getAuthenticationUrl(
    redirect,
    null,
    'code',
    'offline',
    null,
    'none',
    false,
  );
  return { url: String(url) };
}

export async function authorizeDropbox(
  db: Kysely<DB>,
  companyId: number,
  code: string,
) {
  const dbx = new DropboxAuth(config);
  const token = await dbx.getAccessTokenFromCode(redirect, code);
  const result = dropboxTokenResultSchema.parse(token.result);

  await saveDropboxTokens(db, companyId, {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
  });
  return { token: result.access_token };
}

export async function getDropboxToken(db: Kysely<DB>, companyId: number) {
  const tokens = await getDropboxTokens(db, companyId);
  if (!tokens) return {};

  const dbx = new DropboxAuth({
    ...config,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
  dbx.checkAndRefreshAccessToken();

  if (tokens.accessToken !== dbx.getAccessToken()) {
    await updateDropboxTokens(db, companyId, {
      accessToken: dbx.getAccessToken(),
      refreshToken: dbx.getRefreshToken(),
    });
  }
  return { token: tokens.accessToken };
}

export async function disconnectDropbox(db: Kysely<DB>, companyId: number) {
  const tokens = await getDropboxTokens(db, companyId);
  if (!tokens) throw httpErrors.NotFound('Dropbox token not found');

  const dbx = new Dropbox({ ...config, refreshToken: tokens.refreshToken });
  await dbx.authTokenRevoke();
  return deleteDropboxTokens(db, companyId);
}
