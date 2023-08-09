"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RootController {
    static status(_req, reply) {
        reply.send({ status: 'ok' });
    }
    static report(req, reply) {
        const body = req.body;
        const message = body.violation
            ? 'CSP Violation: ' + body.violation
            : 'CSP Violation';
        req.log.warn(message, {
            'csp-report': body,
            label: 'CSP violation',
        });
        reply.send({ status: 'ok' });
    }
}
exports.default = RootController;
