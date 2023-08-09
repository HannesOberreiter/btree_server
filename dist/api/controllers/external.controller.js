"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const ical_generator_1 = __importStar(require("ical-generator"));
const dayjs_1 = __importDefault(require("dayjs"));
const api_util_js_1 = require("../utils/api.util.js");
const premium_util_js_1 = require("../utils/premium.util.js");
const calendar_util_js_1 = require("../utils/calendar.util.js");
const foxyoffice_util_js_1 = require("../utils/foxyoffice.util.js");
const constants_config_js_1 = require("../../config/constants.config.js");
class ExternalController {
    static async ical(req, reply) {
        const params = req.params;
        const company = await (0, api_util_js_1.getCompany)(params.api);
        const premium = await (0, premium_util_js_1.isPremium)(company.id);
        if (!premium) {
            throw http_errors_1.default.PaymentRequired();
        }
        let results = [];
        const payload = {
            user: {
                user_id: company.id,
            },
            params: {
                start: (0, dayjs_1.default)().subtract(6, 'month'),
                end: (0, dayjs_1.default)().add(6, 'month'),
            },
        };
        const calendar = (0, ical_generator_1.default)({
            name: `b.tree - ${params.source}`,
            // timezone: 'UTC', // standard is UTC no need to define it
            prodId: {
                company: 'btree',
                product: 'events',
            },
        });
        calendar.method(ical_generator_1.ICalCalendarMethod.PUBLISH);
        switch (params.source) {
            case constants_config_js_1.SOURCE.todo:
                results = await (0, calendar_util_js_1.getTodos)(payload.params, payload.user);
                break;
            case constants_config_js_1.SOURCE.rearing:
                results = await (0, calendar_util_js_1.getRearings)(payload.params, payload.user);
                break;
            case constants_config_js_1.SOURCE.movedate:
                results = await (0, calendar_util_js_1.getMovements)(payload.params, payload.user);
                break;
            case constants_config_js_1.SOURCE.scale_data:
                results = await (0, calendar_util_js_1.getScaleData)(payload.params, payload.user);
                break;
            default:
                results = await (0, calendar_util_js_1.getTask)(payload.params, payload.user, params.source);
                break;
        }
        for (const i in results) {
            const result = results[i];
            calendar.createEvent({
                id: `${result.table}_${i}`,
                start: result.start,
                end: result.end,
                allDay: result.allDay ? true : false,
                summary: `${result.unicode ? result.unicode + ' ' : ''} ${result.title}`,
                description: result.description,
                //floating: true, // floating would mean always an event on 12:00 would be always on 12:00 no matter the timezone
                //timezone: 'UTC', // standard is UTC no need to define it
                url: 'https://app.btree.at/',
            });
        }
        calendar.serve(reply.raw, `btree-${params.source}-${new Date().toISOString()}.ics`);
    }
    /**
     * @description  Local development use Stripe CLI and redirect webhooks: stripe listen --forward-to localhost:8101/api/v1/external/stripe/webhook
     */
    static async stripeWebhook(req, reply) {
        const event = req.body;
        const object = event.data.object;
        if (event.type === 'checkout.session.completed') {
            const user_id = parseInt(object.client_reference_id);
            let amount = 0;
            try {
                amount = parseFloat(object.amount_total) / 100;
            }
            catch (e) {
                req.log.error(e);
            }
            await (0, premium_util_js_1.addPremium)(user_id, 12, amount, 'stripe');
            (0, foxyoffice_util_js_1.createInvoice)(object.customer_details.email, amount, 'Stripe');
        }
        return {};
    }
}
exports.default = ExternalController;
