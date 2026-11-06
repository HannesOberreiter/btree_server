import { describe, expect, it } from 'vitest';

import { deltaText } from '../../src/services/wizbee.service.js';

describe('WizBee stream text', () => {
  it('returns string content as it is', () => {
    expect(deltaText('Hallo')).toBe('Hallo');
  });

  it('keeps the text and skips the thinking of a mixed event', () => {
    // A reasoning model ends its thinking and starts the answer in one event.
    expect(
      deltaText([
        {
          type: 'thinking',
          thinking: [{ type: 'text', text: 'The user wants a greeting.' }],
        },
        { type: 'text', text: 'Hallo' },
      ]),
    ).toBe('Hallo');
  });

  it('returns an empty text for thinking only or no content', () => {
    expect(
      deltaText([
        { type: 'thinking', thinking: [{ type: 'text', text: 'Plan' }] },
      ]),
    ).toBe('');
    expect(deltaText(undefined)).toBe('');
    expect(deltaText(null)).toBe('');
  });
});
