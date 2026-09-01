import { Buffer } from 'node:buffer';

import type { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';

import { KyselyServer } from '../../servers/kysely.server.js';
import {
  createMcpConsentRequest,
  exchangeMcpAuthorizationCode,
  finishMcpConsent,
  getMcpAuthorizationErrorRedirect,
  getMcpAuthorizationRequest,
  getMcpOAuthLoginRedirect,
  listMcpConnections,
  McpOAuthError,
  refreshMcpAccessToken,
  registerMcpOAuthClient,
  revokeMcpConnection,
  type McpClientCredentials,
} from '../modules/mcp_oauth.module.js';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function consentPage(
  clientName: string,
  redirectUri: string,
  scope: string,
  token: string,
) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Authorize b.tree MCP</title>
</head>
<body>
  <main>
    <h1>Authorize ${escapeHtml(clientName)}</h1>
    <p>Allow this client to use your b.tree tools and beekeeping data.</p>
    <dl>
      <dt>Scope</dt><dd>${escapeHtml(scope)}</dd>
      <dt>Redirect</dt><dd>${escapeHtml(redirectUri)}</dd>
    </dl>
    <form method="post" action="/api/v1/mcp/oauth/authorize">
      <input type="hidden" name="consent_token" value="${escapeHtml(token)}">
      <button type="submit" name="decision" value="approve">Allow</button>
      <button type="submit" name="decision" value="deny">Deny</button>
    </form>
  </main>
</body>
</html>`;
}

function requireValidOAuthRequest(request: FastifyRequest) {
  if (request.validationError) {
    throw new McpOAuthError('invalid_request', 'Invalid OAuth request');
  }
}

function sendOAuthError(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown,
) {
  if (error instanceof McpOAuthError) {
    if (
      error.oauthCode === 'invalid_client' &&
      error.statusCode === 401 &&
      /^Basic(?:\s|$)/i.test(request.headers.authorization ?? '')
    ) {
      reply.header('WWW-Authenticate', 'Basic realm="b.tree MCP OAuth"');
    }
    return reply.code(error.statusCode).send({
      error: error.oauthCode,
      error_description: error.message,
    });
  }
  throw error;
}

function parseBasicCredentials(
  authorization: string | undefined,
): McpClientCredentials | undefined {
  if (!authorization) return undefined;
  const [scheme, encoded] = authorization.split(' ', 2);
  if (scheme?.toLowerCase() !== 'basic' || !encoded) return undefined;

  let decoded: string;
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    throw new McpOAuthError('invalid_client', 'Invalid OAuth client', 401);
  }
  const separator = decoded.indexOf(':');
  if (separator < 0) {
    throw new McpOAuthError('invalid_client', 'Invalid OAuth client', 401);
  }
  return {
    clientId: decoded.slice(0, separator),
    clientSecret: decoded.slice(separator + 1),
    authMethod: 'client_secret_basic',
  };
}

function getClientCredentials(request: FastifyRequest): McpClientCredentials {
  const body = request.body as Record<string, unknown>;
  const basic = parseBasicCredentials(request.headers.authorization);
  const bodyClientId =
    typeof body.client_id === 'string' ? body.client_id : undefined;
  const bodyClientSecret =
    typeof body.client_secret === 'string' ? body.client_secret : undefined;

  if (basic && bodyClientId && basic.clientId !== bodyClientId) {
    throw new McpOAuthError('invalid_client', 'Invalid OAuth client', 401);
  }

  const clientId = basic?.clientId ?? bodyClientId;
  if (!clientId) {
    throw new McpOAuthError('invalid_client', 'Missing OAuth client', 401);
  }
  return {
    clientId,
    clientSecret: basic?.clientSecret ?? bodyClientSecret,
    authMethod: basic
      ? 'client_secret_basic'
      : bodyClientSecret
        ? 'client_secret_post'
        : 'none',
  };
}

export default class McpOAuthController {
  static async connections(request: FastifyRequest, reply: FastifyReply) {
    const user = request.session.user;
    if (!user) throw httpErrors.Unauthorized('Unauthorized');
    return reply.send(
      await listMcpConnections(KyselyServer.getInstance().db, user),
    );
  }

  static async revokeConnection(request: FastifyRequest, reply: FastifyReply) {
    const user = request.session.user;
    if (!user) throw httpErrors.Unauthorized('Unauthorized');
    const { tokenFamily } = request.params as { tokenFamily: string };
    const revoked = await revokeMcpConnection(
      KyselyServer.getInstance().db,
      user,
      tokenFamily,
    );
    if (!revoked) throw httpErrors.NotFound('MCP connection not found');
    return reply.send({ revoked });
  }

  static async revokeConnections(request: FastifyRequest, reply: FastifyReply) {
    const user = request.session.user;
    if (!user) throw httpErrors.Unauthorized('Unauthorized');
    const revoked = await revokeMcpConnection(
      KyselyServer.getInstance().db,
      user,
    );
    return reply.send({ revoked });
  }

  static async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      requireValidOAuthRequest(request);
      const registration = await registerMcpOAuthClient(
        KyselyServer.getInstance().db,
        request.body,
      );
      return reply.code(201).send(registration);
    } catch (error) {
      return sendOAuthError(request, reply, error);
    }
  }

  static async authorize(request: FastifyRequest, reply: FastifyReply) {
    try {
      requireValidOAuthRequest(request);
      const authorization = await getMcpAuthorizationRequest(
        KyselyServer.getInstance().db,
        request.query,
      );
      const sessionUser = request.session?.user;
      if (!sessionUser) {
        return reply.redirect(getMcpOAuthLoginRedirect(request));
      }

      const consent = await createMcpConsentRequest(
        KyselyServer.getInstance().db,
        authorization,
        sessionUser,
      );
      return reply
        .type('text/html; charset=utf-8')
        .send(
          consentPage(
            consent.pending.clientName,
            consent.pending.redirectUri,
            consent.pending.scope,
            consent.token,
          ),
        );
    } catch (error) {
      const redirect = await getMcpAuthorizationErrorRedirect(
        KyselyServer.getInstance().db,
        request.query,
        error,
      );
      if (redirect) return reply.redirect(redirect);
      return sendOAuthError(request, reply, error);
    }
  }

  static async consent(request: FastifyRequest, reply: FastifyReply) {
    try {
      requireValidOAuthRequest(request);
      const sessionUser = request.session?.user;
      if (!sessionUser) {
        throw new McpOAuthError('access_denied', 'Login required', 401);
      }
      const body = request.body as Record<string, unknown>;
      const token =
        typeof body.consent_token === 'string' ? body.consent_token : '';
      const decision = typeof body.decision === 'string' ? body.decision : '';
      if (!token || !['approve', 'deny'].includes(decision)) {
        throw new McpOAuthError('invalid_request', 'Invalid consent response');
      }

      const redirect = await finishMcpConsent(
        KyselyServer.getInstance().db,
        token,
        decision === 'approve',
        sessionUser,
      );
      return reply.redirect(redirect);
    } catch (error) {
      return sendOAuthError(request, reply, error);
    }
  }

  static async token(request: FastifyRequest, reply: FastifyReply) {
    try {
      requireValidOAuthRequest(request);
      const body = request.body as Record<string, unknown>;
      const credentials = getClientCredentials(request);
      const grantType =
        typeof body.grant_type === 'string' ? body.grant_type : '';
      const token =
        grantType === 'authorization_code'
          ? await exchangeMcpAuthorizationCode(
              KyselyServer.getInstance().db,
              body,
              credentials,
            )
          : await refreshMcpAccessToken(
              KyselyServer.getInstance().db,
              body,
              credentials,
            );
      return reply.send(token);
    } catch (error) {
      return sendOAuthError(request, reply, error);
    }
  }
}
