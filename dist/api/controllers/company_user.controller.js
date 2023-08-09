"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const http_errors_1 = __importDefault(require("http-errors"));
const company_bee_model_js_1 = require("../models/company_bee.model.js");
const company_model_js_1 = require("../models/company.model.js");
const user_controller_js_1 = __importDefault(require("./user.controller.js"));
const auth_controller_js_1 = __importDefault(require("./auth.controller.js"));
const user_model_js_1 = require("../models/user.model.js");
class CompanyUserController {
    static async patch(req, reply) {
        const body = req.body;
        const result = await company_bee_model_js_1.CompanyBee.query()
            .patch({ rank: body.rank })
            .where({
            bee_id: req.params.id,
            user_id: req.session.user.user_id,
        });
        return result;
    }
    static async getUser(req, reply) {
        const result = await company_bee_model_js_1.CompanyBee.query()
            .withGraphJoined('[user, company]')
            .where({ user_id: req.session.user.user_id });
        return result;
    }
    static async addUser(req, reply) {
        const body = req.body;
        const userExists = await user_model_js_1.User.query()
            .select('id')
            .findOne({ email: body.email });
        if (userExists) {
            const duplicate = await company_bee_model_js_1.CompanyBee.query().select('id').findOne({
                bee_id: userExists.id,
                user_id: req.session.user.user_id,
            });
            if (duplicate) {
                return { userExists };
            }
            else {
                await company_bee_model_js_1.CompanyBee.query().insert({
                    bee_id: userExists.id,
                    user_id: req.session.user.user_id,
                    rank: 3,
                });
                return { userExists };
            }
        }
        else {
            const inviter = await user_model_js_1.User.query()
                .select('lang')
                .findById(req.session.user.bee_id);
            const newUser = await user_model_js_1.User.query().insertAndFetch({
                email: body.email,
                lang: inviter.lang,
                password: (0, crypto_1.randomBytes)(40).toString('hex'),
                salt: (0, crypto_1.randomBytes)(40).toString('hex'),
                last_visit: new Date('1989-01-05'),
            });
            await company_bee_model_js_1.CompanyBee.query().insert({
                bee_id: newUser.id,
                user_id: req.session.user.user_id,
                rank: 3,
            });
            const result = await auth_controller_js_1.default.resetRequest(req, reply);
            return { ...result };
        }
    }
    static async removeUser(req, reply) {
        const params = req.params;
        const result = await company_bee_model_js_1.CompanyBee.query()
            .delete()
            .where({ bee_id: params.id, user_id: req.session.user.user_id });
        return result;
    }
    static async delete(req, reply) {
        const params = req.params;
        const otherUser = await company_model_js_1.Company.query()
            .select('user.id')
            .withGraphJoined('user')
            .whereNot({
            'user.id': req.session.user.bee_id,
        })
            .where({
            'companies.id': params.company_id,
        });
        if (otherUser.length === 0) {
            throw http_errors_1.default.Forbidden('No other users found, cannot remove your access.');
        }
        const otherCompanies = await company_model_js_1.Company.query()
            .select('companies.id as id')
            .withGraphJoined('user')
            .where({
            'user.id': req.session.user.bee_id,
        })
            .whereNot({
            'companies.id': params.company_id,
        });
        if (otherCompanies.length === 0) {
            reply.send(http_errors_1.default.Forbidden('This is your last company, you cannot remove access to it.'));
            return;
        }
        req.body['saved_company'] = otherCompanies[0].id;
        await company_bee_model_js_1.CompanyBee.query()
            .delete()
            .where({ user_id: params.company_id, bee_id: req.session.user.bee_id });
        return await user_controller_js_1.default.changeCompany(req, reply);
    }
}
exports.default = CompanyUserController;
