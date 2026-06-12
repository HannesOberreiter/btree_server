import type { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';

import { AgentKeyModel, generateAgentKey } from '../models/agent_key.model.js';
import { isPremium } from '../utils/premium.util.js';

interface CreateKeyBody {
  label?: string;
  valid_to?: string | null;
}

const AgentKeyController = {
  /**
   * POST /v1/agent_key — Create a new agent API key
   * Returns the plaintext key ONCE.
   */
  async create(req: FastifyRequest, reply: FastifyReply) {
    const user = req.session.user;
    if (!user) throw httpErrors.Unauthorized();

    const premium = await isPremium(user.user_id);
    if (!premium) {
      throw httpErrors.Forbidden(
        'Agent API keys require an active premium subscription.',
      );
    }

    const body = req.body as CreateKeyBody;
    const { plaintextKey, keyHash, salt, keyPrefix } = generateAgentKey();

    const validTo = body.valid_to ? new Date(body.valid_to) : null;
    if (validTo && Number.isNaN(validTo.getTime())) {
      throw httpErrors.BadRequest(
        'Invalid valid_to date format. Use ISO 8601 (e.g. 2025-12-31T23:59:59Z).',
      );
    }

    const id = await AgentKeyModel.create({
      userId: user.user_id,
      beeId: user.bee_id,
      keyHash,
      salt,
      keyPrefix,
      label: body.label || null,
      validTo,
    });

    reply.statusCode = 201;
    return {
      id,
      key: plaintextKey,
      key_prefix: keyPrefix,
      label: body.label || null,
      valid_to: validTo,
      message: 'Store this key securely — it will not be shown again.',
    };
  },

  /**
   * GET /v1/agent_key — List all keys for the current user
   * Never returns hash or salt.
   */
  async list(req: FastifyRequest, _reply: FastifyReply) {
    const user = req.session.user;
    if (!user) {
      throw httpErrors.Unauthorized();
    }

    const keys = await AgentKeyModel.findByBeeId(user.bee_id);
    return keys;
  },

  /**
   * DELETE /v1/agent_key/:id — Delete a specific key
   */
  async remove(req: FastifyRequest, reply: FastifyReply) {
    const user = req.session.user;
    if (!user) throw httpErrors.Unauthorized();

    const { id } = req.params as { id: string };
    const deleted = await AgentKeyModel.deleteById(Number(id), user.bee_id);

    if (deleted === 0) {
      throw httpErrors.NotFound('Key not found or not owned by you.');
    }

    reply.statusCode = 200;
    return { message: 'Key deleted.' };
  },
};

export default AgentKeyController;
