"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apiary_model_js_1 = require("../models/apiary.model.js");
const temperature_util_js_1 = require("../utils/temperature.util.js");
const premium_util_js_1 = require("../utils/premium.util.js");
const paypal_util_js_1 = require("../utils/paypal.util.js");
const stripe_util_js_1 = require("../utils/stripe.util.js");
const foxyoffice_util_js_1 = require("../utils/foxyoffice.util.js");
const wizbee_service_js_1 = require("../../services/wizbee.service.js");
const wizbee_token_model_js_1 = require("../models/wizbee_token.model.js");
const environment_config_js_1 = require("../../config/environment.config.js");
const http_errors_1 = __importDefault(require("http-errors"));
class ServiceController {
    static async getTemperature(req, reply) {
        const params = req.params;
        const premium = await (0, premium_util_js_1.isPremium)(req.session.user.user_id);
        if (!premium) {
            throw http_errors_1.default.PaymentRequired();
        }
        const apiary = await apiary_model_js_1.Apiary.query()
            .findById(params.apiary_id)
            .where({ user_id: req.session.user.user_id });
        const temp = await (0, temperature_util_js_1.getTemperature)(apiary.latitude, apiary.longitude);
        return temp;
    }
    static async paypalCreateOrder(req, reply) {
        const body = req.body;
        const order = await (0, paypal_util_js_1.createOrder)(req.session.user.user_id, body.amount);
        if (order.status !== 'CREATED') {
            throw http_errors_1.default.InternalServerError('Could not create order');
        }
        return order;
    }
    static async paypalCapturePayment(req, reply) {
        const params = req.params;
        const capture = await (0, paypal_util_js_1.capturePayment)(params.orderID);
        if (capture.status !== 'COMPLETED' && capture.status !== 'APPROVED') {
            throw http_errors_1.default.InternalServerError('Could not capure order');
        }
        let value = 0;
        const mail = capture.payment_source.paypal.email_address;
        try {
            value = parseFloat(capture.purchase_units[0].payments.captures[0].amount.value);
        }
        catch (e) {
            req.log.error(e);
        }
        const paid = await (0, premium_util_js_1.addPremium)(req.session.user.user_id, 12, value, 'paypal');
        (0, foxyoffice_util_js_1.createInvoice)(mail, value, 'PayPal');
        return { ...capture, paid };
    }
    static async stripeCreateOrder(req, reply) {
        const body = req.body;
        const session = await (0, stripe_util_js_1.createOrder)(req.session.user.user_id, body.amount);
        return session;
    }
    static async askWizBee(req, reply) {
        const body = req.body;
        const premium = await (0, premium_util_js_1.isPremium)(req.session.user.user_id);
        if (!premium) {
            throw http_errors_1.default.PaymentRequired();
        }
        const date = new Date().toISOString().split('T')[0];
        let savedTokens = 0;
        let savedQuestions = 0;
        let id = null;
        const usedTokens = await wizbee_token_model_js_1.WizBeeToken.query().findOne({
            bee_id: req.session.user.bee_id,
            date: date,
        });
        if (usedTokens) {
            if (usedTokens.usedTokens <= 0) {
                throw http_errors_1.default.TooManyRequests('Daily tokens limit reached');
            }
            savedTokens = usedTokens.usedTokens;
            savedQuestions = usedTokens.countQuestions;
            id = usedTokens.id;
        }
        else {
            const insert = await wizbee_token_model_js_1.WizBeeToken.query().insertAndFetch({
                bee_id: req.session.user.bee_id,
                date: date,
                usedTokens: environment_config_js_1.openAI.dailyUserTokenLimit,
                countQuestions: 0,
            });
            savedTokens = insert.usedTokens;
            savedQuestions = insert.countQuestions;
            id = insert.id;
        }
        const bot = new wizbee_service_js_1.WizBee();
        const result = await bot.search(body.question, body.lang);
        if (!result) {
            throw http_errors_1.default.NotFound('Could not get answer from WizBee');
        }
        if (result.tokens && id) {
            savedTokens -= result.tokens;
            savedTokens = savedTokens < 0 ? 0 : savedTokens;
            savedQuestions += 1;
            await wizbee_token_model_js_1.WizBeeToken.query().patchAndFetchById(id, {
                usedTokens: savedTokens,
                countQuestions: savedQuestions,
            });
        }
        return { ...result, savedTokens, savedQuestions };
    }
}
exports.default = ServiceController;
