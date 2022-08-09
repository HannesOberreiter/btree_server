import { frontend, stripeSecret } from '@/config/environment.config';
import Stripe from 'stripe';

export async function createOrder(user_id: number, amount: number) {
  const stripe = new Stripe(stripeSecret, {
    apiVersion: '2022-08-01',
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
    success_url: `${frontend}/premium?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontend}/premium`,
    client_reference_id: user_id + '',
  });
  return session;
}
