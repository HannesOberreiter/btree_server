"use strict";
/**
  https://github.com/paypal-examples/docs-examples/tree/main/standard-integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.capturePayment = exports.createOrder = void 0;
const environment_config_js_1 = require("../../config/environment.config.js");
// https://developer.paypal.com/docs/api/orders/v2/#orders_create
async function createOrder(user_id, amount) {
    const accessToken = await generateAccessToken();
    const url = `${environment_config_js_1.paypalBase}/v2/checkout/orders`;
    const response = await fetch(url, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            intent: 'CAPTURE',
            application_context: {
                shipping_preference: 'NO_SHIPPING',
            },
            purchase_units: [
                {
                    custom_id: user_id + '',
                    invoice_id: `ID: ${user_id}, Date: ${new Date().toISOString()}`,
                    amount: {
                        currency_code: 'EUR',
                        value: amount,
                    },
                    category: 'DIGITAL_GOODS',
                },
            ],
        }),
    });
    const data = await response.json();
    return data;
}
exports.createOrder = createOrder;
// https://developer.paypal.com/docs/api/orders/v2/#orders_capture
async function capturePayment(orderId) {
    const accessToken = await generateAccessToken();
    const url = `${environment_config_js_1.paypalBase}/v2/checkout/orders/${orderId}/capture`;
    const response = await fetch(url, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
    });
    const data = await response.json();
    return data;
}
exports.capturePayment = capturePayment;
async function generateAccessToken() {
    const auth = Buffer.from(environment_config_js_1.paypalClientId + ':' + environment_config_js_1.paypalAppSecret).toString('base64');
    const response = await fetch(`${environment_config_js_1.paypalBase}/v1/oauth2/token`, {
        method: 'post',
        body: 'grant_type=client_credentials',
        headers: {
            Authorization: `Basic ${auth}`,
        },
    });
    const data = (await response.json());
    return data.access_token;
}
