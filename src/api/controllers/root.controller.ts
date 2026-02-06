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

    req.log.warn(
      {
        'csp-report': body,
        'label': 'CSP violation',
      },
      message,
    );

    reply.send({ status: 'ok' });
  }
}
