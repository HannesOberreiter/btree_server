import Stripe from 'stripe';

import { frontend, stripeSecret } from '../../config/environment.config.js';

export async function createOrder(
  user_id: number,
  amount: number,
  quantity: number,
) {
  const stripe = new Stripe(stripeSecret, {
    apiVersion: '2024-04-10',
    typescript: true,
  });
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        quantity: quantity,
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
    success_url: `${frontend}/premium?session_id={CHECKOUT_SESSION_ID}&server=${process.env.SERVER}`,
    cancel_url: `${frontend}/premium?server=${process.env.SERVER}`,
    client_reference_id: JSON.stringify({
      user_id: user_id,
      quantity: quantity,
      server: process.env.SERVER,
    }),
  });
  return session;
}
