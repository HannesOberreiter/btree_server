import type { FastifyReply, FastifyRequest } from 'fastify';

export default class RootController {
  static status(_req: FastifyRequest, reply: FastifyReply) {
    reply.send({ status: 'ok' });
  }

  static report(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const message = body.violation
      ? `CSP Violation: ${body.violation}`
      : 'CSP Violation';

    req.log.warn(message, {
      'csp-report': body,
      'label': 'CSP violation',
    });

    reply.send({ status: 'ok' });
  }
}
