import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { addPremium } from '../../src/api/modules/premium.module.js';
import { KyselyServer } from '../../src/servers/kysely.server.js';

const providerId = `test-payment-${Date.now()}`;
let companyId = 0;

describe('premium payment operations', () => {
  const db = KyselyServer.getInstance().db;

  beforeAll(async () => {
    const company = await db
      .insertInto('companies')
      .values({ name: `Premium operation ${Date.now()}` })
      .executeTakeFirstOrThrow();
    companyId = Number(company.insertId);
  });

  afterAll(async () => {
    await db
      .deleteFrom('payments')
      .where('type', '=', 'mollie')
      .where('provider_id', '=', providerId)
      .execute();
    await db.deleteFrom('companies').where('id', '=', companyId).execute();
  });

  it('applies a provider payment only once', async () => {
    const first = await addPremium(db, companyId, 1, 10, 'mollie', providerId);
    const second = await addPremium(db, companyId, 1, 10, 'mollie', providerId);

    const payments = await db
      .selectFrom('payments')
      .select('id')
      .where('type', '=', 'mollie')
      .where('provider_id', '=', providerId)
      .execute();

    expect(first.applied).toBe(true);
    expect(second).toEqual({ paid: first.paid, applied: false });
    expect(payments).toHaveLength(1);
  });
});
