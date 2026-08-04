import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';

import httpErrors from 'http-errors';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type { DB } from '../../types/db.types.js';
import type { CreateBody } from '../schemas/agent_key.schema.js';
import { isPremium } from './premium.module.js';

export const KEY_PREFIX_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

export function generateAgentKey() {
  const rawKey = crypto.randomBytes(KEY_LENGTH);
  const plaintextKey = `btree_ak_${rawKey.toString('base64url')}`;
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const keyHash = crypto
    .createHash('sha256')
    .update(salt + plaintextKey)
    .digest('hex');
  const keyPrefix = plaintextKey.substring(0, KEY_PREFIX_LENGTH);
  return { plaintextKey, keyHash, salt, keyPrefix };
}

export function verifyAgentKey(
  plaintextKey: string,
  storedHash: string,
  storedSalt: string,
): boolean {
  const hash = crypto
    .createHash('sha256')
    .update(storedSalt + plaintextKey)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

export async function createAgentKey(
  db: Kysely<DB>,
  actor: { companyId: number; beeId: number },
  body: CreateBody,
) {
  if (!(await isPremium(actor.companyId, db))) {
    throw httpErrors.Forbidden(
      'Agent API keys require an active premium subscription.',
    );
  }

  const generated = generateAgentKey();
  const validTo = body.valid_to ? new Date(body.valid_to) : null;
  if (validTo && Number.isNaN(validTo.getTime())) {
    throw httpErrors.BadRequest(
      'Invalid valid_to date format. Use ISO 8601 (e.g. 2025-12-31T23:59:59Z).',
    );
  }

  const result = await db
    .insertInto('agent_keys')
    .values({
      user_id: actor.companyId,
      bee_id: actor.beeId,
      key_hash: generated.keyHash,
      salt: generated.salt,
      key_prefix: generated.keyPrefix,
      label: body.label ?? null,
      valid_to: validTo,
    })
    .executeTakeFirstOrThrow();

  return {
    id: Number(result.insertId),
    key: generated.plaintextKey,
    key_prefix: generated.keyPrefix,
    label: body.label ?? null,
    valid_to: validTo,
    message: 'Store this key securely — it will not be shown again.',
  };
}

export function listAgentKeys(db: Database, beeId: number) {
  return db
    .selectFrom('agent_keys')
    .innerJoin('companies', 'companies.id', 'agent_keys.user_id')
    .select([
      'agent_keys.id',
      'agent_keys.user_id',
      'agent_keys.bee_id',
      'agent_keys.key_prefix',
      'agent_keys.label',
      sql<string | null>`agent_keys.last_used`.as('last_used'),
      sql<string>`agent_keys.created_at`.as('created_at'),
      sql<string | null>`agent_keys.valid_to`.as('valid_to'),
      'companies.name as company_name',
    ])
    .where('agent_keys.bee_id', '=', beeId)
    .orderBy('agent_keys.created_at', 'desc')
    .execute();
}

export function findAgentKeysByPrefix(db: Database, prefix: string) {
  return db
    .selectFrom('agent_keys')
    .selectAll()
    .where('key_prefix', '=', prefix)
    .execute();
}

export async function removeAgentKey(db: Database, id: number, beeId: number) {
  const result = await db
    .deleteFrom('agent_keys')
    .where('id', '=', id)
    .where('bee_id', '=', beeId)
    .executeTakeFirst();
  if (Number(result.numDeletedRows) === 0) {
    throw httpErrors.NotFound('Key not found or not owned by you.');
  }
  return { message: 'Key deleted.' };
}

export async function updateAgentKeyLastUsed(db: Database, id: number) {
  await db
    .updateTable('agent_keys')
    .set({ last_used: sql<Date>`UTC_TIMESTAMP()` })
    .where('id', '=', id)
    .execute();
}
