"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAuth = void 0;
const google_auth_library_1 = require("google-auth-library");
const environment_config_js_1 = require("../config/environment.config.js");
const federated_credential_js_1 = require("../api/models/federated_credential.js");
const user_model_js_1 = require("../api/models/user.model.js");
const logger_service_js_1 = require("./logger.service.js");
class GoogleAuth {
    static instance;
    client;
    logger = logger_service_js_1.Logger.getInstance();
    static getInstance() {
        if (!this.instance) {
            this.instance = new this();
        }
        return this.instance;
    }
    constructor() {
        this.client = new google_auth_library_1.OAuth2Client(environment_config_js_1.googleOAuth.clientID, environment_config_js_1.googleOAuth.clientSecret, environment_config_js_1.url + '/api/v1/auth/google/callback');
    }
    generateAuthUrl() {
        return this.client.generateAuthUrl({
            scope: ['profile', 'email'],
        });
    }
    async verify(code) {
        const token = await this.client.getToken(code);
        const ticket = await this.client.verifyIdToken({
            idToken: token.tokens.id_token,
            audience: environment_config_js_1.googleOAuth.clientID,
        });
        const payload = ticket.getPayload();
        return await this.verifyUser(payload.sub, payload.name, 'google', payload.email);
    }
    async verifyUser(id, name, provider, mail) {
        // best case federated is already in database
        const federate = await federated_credential_js_1.FederatedCredential.query().findOne({
            provider_id: id,
        });
        if (federate) {
            await federated_credential_js_1.FederatedCredential.query()
                .patch({
                last_visit: new Date(),
            })
                .where({ id: federate.id });
            this.logger.log('info', 'Federated user logged in', {
                bee_id: federate.bee_id,
                provider: provider,
            });
            return { bee_id: federate.bee_id, name: undefined, email: undefined };
        }
        // check if federated is created by user
        const federatedTemp = await federated_credential_js_1.FederatedCredential.query().findOne({
            mail: mail,
        });
        if (federatedTemp) {
            await federated_credential_js_1.FederatedCredential.query()
                .patch({
                provider: provider,
                provider_id: id,
                last_visit: new Date(),
            })
                .where({ id: federatedTemp.id });
            this.logger.log('info', 'New federated user logged in', {
                bee_id: federate.bee_id,
                provider: provider,
            });
            return {
                bee_id: federatedTemp.bee_id,
                name: undefined,
                email: undefined,
            };
        }
        // check if user exists with verified mail
        let bee_id;
        const user = await user_model_js_1.User.query().findOne({ email: mail });
        if (user) {
            bee_id = user.id;
        }
        // No user found with verified mail, redirect to register page on frontend with name and mail
        if (!bee_id) {
            this.logger.log('info', 'Federated register redirect', {
                provider: provider,
            });
            return { bee_id: undefined, name: name, email: mail };
        }
        // user exists but not federated connection
        await federated_credential_js_1.FederatedCredential.query().insert({
            provider: provider,
            provider_id: id,
            mail: mail,
            bee_id: bee_id,
            last_visit: new Date(),
        });
        this.logger.log('info', 'Federated first login with existing user', {
            bee_id: bee_id,
            provider: provider,
        });
        return { bee_id, name: undefined, email: undefined };
    }
}
exports.GoogleAuth = GoogleAuth;
