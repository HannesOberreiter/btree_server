"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dropbox_1 = require("dropbox");
const environment_config_js_1 = require("../../config/environment.config.js");
const dropbox_model_js_1 = require("../models/dropbox.model.js");
/**
 * @see https://www.dropbox.com/developers/apps?_tk=pilot_lp&_ad=topbar4&_camp=myapps
 */
class DropboxController {
    static config = {
        clientId: environment_config_js_1.dropboxClientId,
        clientSecret: environment_config_js_1.dropboxClientSecret,
    };
    static redirect = `${environment_config_js_1.frontend}/setting/dropbox`; // must be exactly the same as in the Dropbox App defined
    static async get(_req, reply) {
        const dbx = new dropbox_1.DropboxAuth(DropboxController.config);
        const authUrl = await dbx.getAuthenticationUrl(DropboxController.redirect, null, 'code', 'offline', null, 'none', false);
        return { url: authUrl };
    }
    static async auth(req, reply) {
        const { code } = req.params;
        const dbx = new dropbox_1.DropboxAuth(DropboxController.config);
        const token = await dbx.getAccessTokenFromCode(DropboxController.redirect, code);
        const refresh_token = token.result['refresh_token'];
        const access_token = token.result['access_token'];
        await dropbox_model_js_1.Dropbox.transaction(async (trx) => {
            const exist = await dropbox_model_js_1.Dropbox.query(trx)
                .select('id')
                .findOne('user_id', req.session.user.user_id);
            if (exist) {
                return await dropbox_model_js_1.Dropbox.query(trx).findById(exist.id).patch({
                    refresh_token: refresh_token,
                    access_token: access_token,
                });
            }
            else {
                return await dropbox_model_js_1.Dropbox.query(trx).insert({
                    refresh_token: refresh_token,
                    access_token: access_token,
                    user_id: req.session.user.user_id,
                });
            }
        });
        return { token: access_token };
    }
    static async token(req, reply) {
        const token = await dropbox_model_js_1.Dropbox.query().findOne('user_id', req.session.user.user_id);
        if (!token) {
            return { token: undefined };
        }
        // check if access_token is still valid, to prevent one round trip
        const dbx = new dropbox_1.DropboxAuth({
            ...DropboxController.config,
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
        });
        await dbx.checkAndRefreshAccessToken();
        if (token.access_token !== dbx.getAccessToken()) {
            await dropbox_model_js_1.Dropbox.transaction(async (trx) => {
                return dropbox_model_js_1.Dropbox.query(trx)
                    .patch({
                    access_token: dbx.getAccessToken(),
                    refresh_token: dbx.getRefreshToken(),
                })
                    .findOne('user_id', req.session.user.user_id);
            });
        }
        return { token: token.access_token };
    }
    static async delete(req, reply) {
        const result = await dropbox_model_js_1.Dropbox.transaction(async (trx) => {
            const token = await dropbox_model_js_1.Dropbox.query(trx)
                .select('refresh_token')
                .findOne('user_id', req.session.user.user_id);
            const dbx = new dropbox_1.Dropbox({
                ...DropboxController.config,
                refreshToken: token.refresh_token,
            });
            await dbx.authTokenRevoke();
            return dropbox_model_js_1.Dropbox.query(trx)
                .delete()
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
}
exports.default = DropboxController;
