import { PassThrough } from 'node:stream';
import { buffer, text } from 'node:stream/consumers';

import { ZipArchive } from 'archiver';
import { describe, expect, it, vi } from 'vitest';
import yauzl from 'yauzl-promise';

import { downloadCompanyData } from '../../src/api/modules/company_transfer.module.js';
import type { Database } from '../../src/types/database.types.js';

type ExportRow = Record<string, string | number | boolean | Date | null>;

const expectedFiles = [
  'company',
  'hives',
  'hive_types',
  'hive_sources',
  'apiaries',
  'movedates',
  'checkups',
  'checkup_types',
  'feeds',
  'feed_types',
  'treatments',
  'treatment_types',
  'treatment_diseases',
  'treatment_vets',
  'harvests',
  'harvest_types',
  'charges',
  'charge_types',
  'wax_products',
  'wax_origin_types',
  'wax_lots',
  'wax_operations',
  'wax_operation_hives',
  'wax_operation_lines',
  'wax_inventory_counts',
  'queens',
  'queen_matings',
  'queen_races',
  'todos',
  'scales',
  'scale_data',
  'rearings',
  'rearing_types',
].map((name) => `${name}.csv`);

async function exportCsvFiles(rows: Record<string, ExportRow[]>) {
  // Keep the real export/CSV/ZIP pipeline; only database reads use fixtures.
  const db = {
    selectFrom: vi.fn((table: string) => ({
      selectAll: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(rows[table] ?? []),
    })),
  } as unknown as Database;
  const archive = new ZipArchive();
  const output = new PassThrough();
  archive.on('error', (error) => output.destroy(error));
  archive.pipe(output);
  const contents = buffer(output);

  await downloadCompanyData(db, archive, 42);
  await archive.finalize();
  const zip = await yauzl.fromBuffer(await contents);
  const files = new Map<string, string>();
  try {
    for await (const entry of zip) {
      expect(files.has(entry.filename)).toBe(false);
      files.set(entry.filename, await text(await entry.openReadStream()));
    }
  } finally {
    await zip.close();
  }
  return files;
}

describe('company ZIP export', () => {
  it('preserves archive filenames and empty CSV entries', async () => {
    const files = await exportCsvFiles({
      companies: [{ id: 42, name: 'Test company' }],
    });

    expect([...files.keys()].sort()).toEqual([...expectedFiles].sort());
    expect(files.get('company.csv')).toBe('id,name\r\n42,Test company\r\n');
    for (const name of expectedFiles.filter((name) => name !== 'company.csv'))
      expect(files.get(name)).toBe('');
  });

  it('preserves CSV dates, booleans, escaping, line endings, and joined-table contents', async () => {
    const files = await exportCsvFiles({
      companies: [{ id: 42, name: 'Bees, Inc.' }],
      hives: [
        {
          id: 7,
          name: 'Hive "one"\nNorth',
          deleted: false,
          modus: true,
          created_at: new Date('2026-09-14T12:00:00.000Z'),
          note: null,
        },
      ],
      movedates: [{ id: 1, apiary_id: 2, hive_id: 7 }],
      wax_operation_lines: [{ id: 3, operation_id: 4, quantity: 1.5 }],
      scale_data: [{ id: 5, scale_id: 6, weight: 12.5 }],
      rearings: [{ id: 8, name: 'Autumn rearing' }],
    });

    expect(files.get('company.csv')).toBe('id,name\r\n42,"Bees, Inc."\r\n');
    expect(files.get('hives.csv')).toBe(
      'id,name,deleted,modus,created_at,note\r\n' +
        '7,Hive  one  North,0,1,2026-09-14T12:00:00.000Z,\r\n',
    );
    expect(files.get('movedates.csv')).toBe(
      'id,apiary_id,hive_id\r\n1,2,7\r\n',
    );
    expect(files.get('wax_operation_lines.csv')).toBe(
      'id,operation_id,quantity\r\n3,4,1.5\r\n',
    );
    expect(files.get('scale_data.csv')).toBe(
      'id,scale_id,weight\r\n5,6,12.5\r\n',
    );
    expect(files.get('rearings.csv')).toBe('id,name\r\n8,Autumn rearing\r\n');
  });
});
