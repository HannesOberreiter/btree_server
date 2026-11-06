import { beforeAll, describe, expect, it } from 'vitest';

import { paypalCapturePaymentParamsSchema } from '../../src/api/schemas/service.schema.js';
import type { TestAgent } from '../utils.js';
import { createAuthenticatedAgent, doRequest } from '../utils.js';

describe('PayPal capture order ID', () => {
  it.each(['5O190127TN364715T', 'A'.repeat(36)])(
    'accepts the PayPal order ID %s',
    (orderID) => {
      expect(
        paypalCapturePaymentParamsSchema.safeParse({ orderID }).success,
      ).toBe(true);
    },
  );

  let agent: TestAgent;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  it.each([
    ['a path traversal', '..%2F..%2Fv1%2Fpayments'],
    ['lowercase letters', '5o190127tn364715t'],
    ['more than 36 characters', 'A'.repeat(37)],
  ])('rejects %s before PayPal is called', async (_name, orderID) => {
    const res = await doRequest(
      agent,
      'post',
      `/api/v1/service/paypal/orders/${orderID}/capture`,
      null,
      null,
      {},
    );

    expect(res.statusCode).toEqual(400);
  });
});
