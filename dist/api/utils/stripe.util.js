"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = void 0;
const stripe_1 = __importDefault(require("stripe"));
const environment_config_js_1 = require("../../config/environment.config.js");
async function createOrder(user_id, amount) {
    const stripe = new stripe_1.default(environment_config_js_1.stripeSecret, {
        apiVersion: '2022-11-15',
        typescript: true,
    });
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: 'EUR',
                    product_data: {
                        name: 'b.tree Premium',
                    },
                    unit_amount: amount * 100,
                },
            },
        ],
        mode: 'payment',
        success_url: `${environment_config_js_1.frontend}/premium?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${environment_config_js_1.frontend}/premium`,
        client_reference_id: user_id + '',
    });
    return session;
}
exports.createOrder = createOrder;
