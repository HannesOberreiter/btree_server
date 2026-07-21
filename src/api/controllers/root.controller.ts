import type { FastifyReply, FastifyRequest } from 'fastify';

import type { ReportBody } from '../schemas/root.schema.js';

export default class RootController {
  static status(_req: FastifyRequest, reply: FastifyReply) {
    reply.send({ status: 'ok' });
  }

  static report(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as ReportBody;
    const message = body.violation
      ? `CSP Violation: ${JSON.stringify(body.violation)}`
      : 'CSP Violation';

    req.log.warn(
      {
        'csp-report': body,
        label: 'CSP violation',
      },
      message,
    );

    reply.send({ status: 'ok' });
  }
}
