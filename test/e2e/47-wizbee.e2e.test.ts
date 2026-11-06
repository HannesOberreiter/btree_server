import { describe, expect, it } from 'vitest';

import { calculateTranscriptionCost } from '../../src/api/controllers/wizbee.controller.js';
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

describe('WizBee transcription cost', () => {
  it('charges voice notes per audio minute', () => {
    // 60 s at $0.0035 per minute with the 1.5 safety margin.
    expect(
      calculateTranscriptionCost({
        promptTokens: 5,
        completionTokens: 51,
        audioSeconds: 60,
      }),
    ).toBeCloseTo(0.00525, 6);
  });

  it('falls back to the token cost without an audio length', () => {
    expect(
      calculateTranscriptionCost({
        promptTokens: 1000,
        completionTokens: 1000,
        audioSeconds: null,
      }),
    ).toBeCloseTo((0.0007 + 0.0021) * 1.5, 6);
  });
});
