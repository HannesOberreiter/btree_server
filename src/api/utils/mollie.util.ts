import { createMollieClient } from '@mollie/api-client';
import { env, frontend, mollieApiKey, serverLocation, url } from '../../config/environment.config.js';

const mollieClient = createMollieClient({ apiKey: mollieApiKey });

/**
 * @dev Local testing only works with tools like ngrok or localtunnel. ngrok http http://localhost:8101
 */
export function createOrder(
  user_id: number,
  bee_id: number,
  amount: number,
  quantity: number,
) {
  const tunnel = env === 'development' ? 'https://b110-89-144-218-103.ngrok-free.app' : url;
  return mollieClient.payments.create({
    amount: {
      currency: 'EUR',
      value: (amount * quantity).toFixed(2),
    },
    description: `b.tree Beekeeping Application Premium`,
    redirectUrl: `${frontend}/premium?server=${serverLocation}&mollie=true`,
    cancelUrl: `${frontend}/premium?server=${serverLocation}&cancel=true`,
    webhookUrl: `${tunnel}/api/v1/external/mollie/webhook`,
    metadata: {
      user_id,
      bee_id,
      quantity,
      server: serverLocation,
    },
  });
}

export function getPayment(paymentId: string) {
  return mollieClient.payments.get(paymentId);
}
