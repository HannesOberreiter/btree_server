import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';

import { KyselyServer } from '../../servers/kysely.server.js';

export const KEY_PREFIX_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

/**
 * Generate a new agent API key with its hash, salt, and prefix.
 * Returns the plaintext key (to show once) along with the storable parts.
 */
export function generateAgentKey(): {
  plaintextKey: string;
  keyHash: string;
  salt: string;
  keyPrefix: string;
} {
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

/**
 * Verify a plaintext key against a stored hash + salt.
 */
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

export class AgentKeyModel {
  static async create(params: {
    userId: number;
    beeId: number;
    keyHash: string;
    salt: string;
    keyPrefix: string;
    label?: string | null;
    validTo?: Date | null;
  }) {
    const db = KyselyServer.getInstance().db;
    const result = await db
      .insertInto('agent_keys')
      .values({
        user_id: params.userId,
        bee_id: params.beeId,
        key_hash: params.keyHash,
        salt: params.salt,
        key_prefix: params.keyPrefix,
        label: params.label ?? null,
        valid_to: params.validTo ?? null,
      })
      .executeTakeFirst();
    return Number(result.insertId);
  }

  /**
   * List all keys for a user (bee_id). Never returns hash or salt.
   * Joins with companies table to include the company name.
   */
  static async findByBeeId(beeId: number) {
    const db = KyselyServer.getInstance().db;
    return db
      .selectFrom('agent_keys')
      .innerJoin('companies', 'companies.id', 'agent_keys.user_id')
      .select([
        'agent_keys.id',
        'agent_keys.user_id',
        'agent_keys.bee_id',
        'agent_keys.key_prefix',
        'agent_keys.label',
        'agent_keys.last_used',
        'agent_keys.created_at',
        'agent_keys.valid_to',
        'companies.name as company_name',
      ])
      .where('agent_keys.bee_id', '=', beeId)
      .orderBy('agent_keys.created_at', 'desc')
      .execute();
  }

  /**
   * Find key candidates by prefix for fast lookup, then verify hash in code.
   */
  static async findByPrefix(prefix: string) {
    const db = KyselyServer.getInstance().db;
    return db
      .selectFrom('agent_keys')
      .selectAll()
      .where('key_prefix', '=', prefix)
      .execute();
  }

  /**
   * Delete a key by id, scoped to the user's bee_id.
   */
  static async deleteById(id: number, beeId: number) {
    const db = KyselyServer.getInstance().db;
    const result = await db
      .deleteFrom('agent_keys')
      .where('id', '=', id)
      .where('bee_id', '=', beeId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  /**
   * Update the last_used timestamp (fire-and-forget, non-blocking).
   */
  static async updateLastUsed(id: number) {
    const db = KyselyServer.getInstance().db;
    await db
      .updateTable('agent_keys')
      .set({ last_used: new Date() })
      .where('id', '=', id)
      .execute();
  }
}
