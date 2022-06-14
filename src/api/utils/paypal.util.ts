/**
  https://github.com/paypal-examples/docs-examples/tree/main/standard-integration
 */

import {
  paypalAppSecret,
  paypalBase,
  paypalClientId,
} from '@/config/environment.config';
import fetch from 'node-fetch';

// https://developer.paypal.com/docs/api/orders/v2/#orders_create
export async function createOrder(user_id: number, amount: number) {
  const accessToken = await generateAccessToken();
  const url = `${paypalBase}/v2/checkout/orders`;
  const response = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: user_id + '',
          amount: {
            currency_code: 'EUR',
            value: amount,
          },
        },
      ],
    }),
  });
  const data = await response.json();
  console.log(data);
  return data;
}

// https://developer.paypal.com/docs/api/orders/v2/#orders_capture
export async function capturePayment(orderId: string) {
  const accessToken = await generateAccessToken();
  const url = `${paypalBase}/v2/checkout/orders/${orderId}/capture`;
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

async function generateAccessToken() {
  const auth = Buffer.from(paypalClientId + ':' + paypalAppSecret).toString(
    'base64'
  );
  const response = await fetch(`${paypalBase}/v1/oauth2/token`, {
    method: 'post',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  const data = await response.json();
  return data.access_token;
}
