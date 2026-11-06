import { afterEach, describe, expect, it, vi } from 'vitest';

import { executeWizBeeTool } from '../../src/api/modules/wizbee_tools.module.js';
import type { Database } from '../../src/types/database.types.js';

const unusedDb = {} as Database;
const context = { userId: 1, beeId: 1, rank: 2 };

const docs = [
  '# b.tree agent docs',
  '## Latest Updates',
  '### btree-client-7.10.0 [2026-11-06]',
  '- Book Stock from Tasks: done tasks book stock.',
  '## First Steps',
  '### Stock',
  'Track your stock with stock movements.',
  '### Wax Cycle',
  'Document wax lots.',
  '## Other Features',
  '### Offline Mode',
  'The app works offline.',
].join('\n');

function stubDocs(text: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(text, { status: 200 })),
  );
}

async function fetchDocs(input: { query?: string }) {
  return (await executeWizBeeTool(
    unusedDb,
    'btreeDocumentation',
    input,
    context,
  )) as { documentation: string };
}

describe('WizBee documentation tool', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns only the section list without a query', async () => {
    stubDocs(docs);

    const { documentation } = await fetchDocs({});

    expect(documentation).toContain('No query given.');
    expect(documentation).toContain('again with a query');
    expect(documentation).toContain('### Stock');
    expect(documentation).toContain('### Offline Mode');
    expect(documentation).not.toContain('Track your stock');
  });

  it('returns the matching sections for a query', async () => {
    stubDocs(docs);

    const { documentation } = await fetchDocs({ query: 'offline' });

    expect(documentation).toContain('The app works offline.');
    expect(documentation).not.toContain('Document wax lots.');
  });

  it('returns the section list when no section matches', async () => {
    stubDocs(docs);

    const { documentation } = await fetchDocs({ query: 'zzzzzz' });

    expect(documentation).toContain('No section matches the query "zzzzzz".');
    expect(documentation).toContain('### Wax Cycle');
  });

  it('keeps large documentation below the tool result limit', async () => {
    const sections = Array.from(
      { length: 20 },
      (_, index) => `### Stock part ${index}\n${'stock '.repeat(2_000)}`,
    );
    stubDocs(['## First Steps', ...sections].join('\n'));

    const result = await executeWizBeeTool(
      unusedDb,
      'btreeDocumentation',
      { query: 'stock' },
      context,
    );

    expect(result).not.toMatchObject({ ok: false });
    expect(JSON.stringify(result).length).toBeLessThanOrEqual(60_000);
  });
});
