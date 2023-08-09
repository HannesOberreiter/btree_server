"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscourseSSO = void 0;
const crypto_1 = __importDefault(require("crypto"));
const querystring_1 = __importDefault(require("querystring"));
/***
 * @description  Helper class for disourse SSO service
 * @see https://github.com/ArmedGuy/discourse_sso_node
 */
class DiscourseSSO {
    secret;
    constructor(secret) {
        this.secret = secret;
    }
    getHmac() {
        return crypto_1.default.createHmac('sha256', this.secret);
    }
    validate(payload, sig) {
        const hmac = this.getHmac();
        hmac.update(querystring_1.default.unescape(payload));
        if (hmac.digest('hex') === sig) {
            return true;
        }
        else {
            return false;
        }
    }
    getNonce(payload) {
        const q = querystring_1.default.parse(Buffer.from(querystring_1.default.unescape(payload), 'base64').toString());
        if ('nonce' in q) {
            return q['nonce'];
        }
        else {
            throw new Error('Missing Nonce in payload!');
        }
    }
    buildLoginString(params) {
        if (!('external_id' in params)) {
            throw new Error("Missing required parameter 'external_id'");
        }
        if (!('nonce' in params)) {
            throw new Error("Missing required parameter 'nonce'");
        }
        if (!('email' in params)) {
            throw new Error("Missing required parameter 'email'");
        }
        const payload = Buffer.from(querystring_1.default.stringify(params), 'utf8').toString('base64');
        const hmac = this.getHmac();
        hmac.update(payload);
        return querystring_1.default.stringify({
            sso: payload,
            sig: hmac.digest('hex'),
        });
    }
}
exports.DiscourseSSO = DiscourseSSO;
