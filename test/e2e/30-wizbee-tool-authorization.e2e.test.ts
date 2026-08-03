import { describe, expect, it } from 'vitest';

import {
  executeWizBeeTool,
  wizBeeToolDefinitions,
} from '../../src/api/modules/wizbee_tools.module.js';
import type { Database } from '../../src/types/database.types.js';

const unusedDb = {} as Database;

describe('WizBee tool authorization', () => {
  it.each([
    ['createApiary', { name: 'Restricted apiary' }],
    ['patchApiary', { id: 1, name: 'Restricted apiary' }],
    [
      'createHive',
      {
        name: 'Restricted hive',
        apiaryId: 1,
        initialMovementDate: '2026-01-01',
      },
    ],
    ['patchHive', { hiveId: 1, name: 'Restricted hive' }],
  ])('denies admin-only tool %s to normal users', async (toolName, input) => {
    const result = await executeWizBeeTool(unusedDb, toolName, input, {
      userId: 1,
      beeId: 1,
      rank: 2,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'forbidden', status: 403 },
    });
  });

  it.each([
    ['createMovement', { hiveId: 1, apiaryId: 1, date: '2026-01-01' }],
    [
      'createWaxOperation',
      {
        date: '2026-01-01',
        type: 'production',
        originTypeId: 1,
        outputs: [{ productId: 1, quantityKg: 1 }],
      },
    ],
    ['reverseWaxOperation', { operationId: 1 }],
  ])('denies write tool %s to read-only users', async (toolName, input) => {
    const result = await executeWizBeeTool(unusedDb, toolName, input, {
      userId: 1,
      beeId: 1,
      rank: 3,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'forbidden', status: 403 },
    });
  });

  it('exposes non-destructive wax tools only', () => {
    const names = wizBeeToolDefinitions.map((definition) => definition.name);

    expect(names).toEqual(
      expect.arrayContaining([
        'fetchWaxLedger',
        'createWaxOperation',
        'reverseWaxOperation',
      ]),
    );
    expect(names).not.toContain('deleteWaxLot');
    expect(names).not.toContain('deleteWaxOperation');
  });

  it('denies all tools to ghost users', async () => {
    const result = await executeWizBeeTool(
      unusedDb,
      'btreeDocumentation',
      {},
      { userId: 1, beeId: 1, rank: 4 },
    );

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'forbidden', status: 403 },
    });
  });
});
