import type { onSendHookHandler } from 'fastify';

/**
 * Mark reviewed public JSON routes after parent onSend hooks (including session
 * cookies) have run. Attach explicitly; never register globally.
 * Bunny caches each allowlisted route by request (GET without Cookie or
 * Authorization), not by this marker; the marker only selects the public browser
 * policy. Rate headers are stripped because Bunny may store these responses.
 * The CDN configuration owns the shared-cache TTL; browsers revalidate. Public
 * map misses query the DB directly.
 */
export const publicCache: onSendHookHandler = (
  request,
  reply,
  payload,
  done,
) => {
  const vary = reply.getHeader('Vary');
  reply.header(
    'Vary',
    [vary, 'Cookie', 'Authorization'].filter(Boolean).join(', '),
  );

  const contentType = String(reply.getHeader('Content-Type') ?? '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase();
  const eligible =
    request.method === 'GET' &&
    !request.url.includes('?') &&
    request.headers.cookie === undefined &&
    request.headers.authorization === undefined &&
    !request.session?.user &&
    reply.statusCode === 200 &&
    contentType === 'application/json' &&
    !reply.hasHeader('Set-Cookie');

  if (eligible) {
    // A cached response must not expose another viewer's origin rate counter.
    // Bunny may also cache credential-free query-string variants marked bypass;
    // those keep the first requester's rate headers, which is accepted.
    reply.removeHeader('X-RateLimit-Limit');
    reply.removeHeader('X-RateLimit-Remaining');
    reply.removeHeader('X-RateLimit-Reset');
  }

  reply.header('X-Btree-Public-Cache', eligible ? 'eligible' : 'bypass');
  reply.header(
    'Cache-Control',
    eligible ? 'public, max-age=0' : 'private, no-store',
  );
  done(null, payload);
};
