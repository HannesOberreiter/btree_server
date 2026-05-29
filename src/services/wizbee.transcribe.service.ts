import type { Buffer } from 'node:buffer';

import { Mistral } from '@mistralai/mistralai';

import { mistralAI } from '../config/environment.config.js';

/**
 * WizBee Voice Transcription Service
 *
 */
const mistralClient = new Mistral({ apiKey: mistralAI.key });

/**
 * Pinned transcription model. Voxtral Mini is cheap, fast and sufficient for
 * short voice notes (≤ a few minutes). Bump after re-checking pricing and
 * availability at https://docs.mistral.ai/getting-started/models/.
 */
const TRANSCRIPTION_MODEL = 'voxtral-mini-latest';
const SUPPORTED_LANGUAGES = new Set(['en', 'de', 'fr', 'it']);

const CONTEXT_BIAS: Record<string, string[]> = {
  en: [
    'b.tree',
    'apiary',
    'hive',
    'colony',
    'queen',
    'brood',
    'super',
    'frame',
    'varroa',
    'oxalic acid',
    'formic acid',
    'thymol',
    'fondant',
    'sugar syrup',
    'honey flow',
    'nuc',
    'swarm',
    'requeen',
    'checkup',
    'treatment',
    'harvest',
    'feed',
    'movedate',
    'todo',
  ],
  de: [
    'b.tree',
    'Bienenstand',
    'Bienenvolk',
    'Volk',
    'Völker',
    'Stock',
    'Beute',
    'Königin',
    'Weisel',
    'Brut',
    'Honigraum',
    'Brutraum',
    'Rähmchen',
    'Wabe',
    'Mittelwand',
    'Varroa',
    'Varroabehandlung',
    'Oxalsäure',
    'Ameisensäure',
    'Thymol',
    'Futterteig',
    'Zuckerwasser',
    'Zuckersirup',
    'Ableger',
    'Kunstschwarm',
    'Schwarm',
    'Durchsicht',
    'Kontrolle',
    'Behandlung',
    'Ernte',
    'Fütterung',
  ],
  fr: [
    'b.tree',
    'rucher',
    'ruche',
    'colonie',
    'essaim',
    'reine',
    'couvain',
    'hausse',
    'cadre',
    'cire gaufrée',
    'varroa',
    'acide oxalique',
    'acide formique',
    'thymol',
    'candi',
    'sirop de sucre',
    'miellée',
    'nucléus',
    'essaimage',
    'visite',
    'traitement',
    'récolte',
    'nourrissement',
  ],
  it: [
    'b.tree',
    'apiario',
    'arnia',
    'alveare',
    'famiglia',
    'regina',
    'covata',
    'melario',
    'nido',
    'telaino',
    'foglio cereo',
    'varroa',
    'acido ossalico',
    'acido formico',
    'timolo',
    'candito',
    'sciroppo zuccherino',
    'importazione',
    'nucleo',
    'sciamatura',
    'visita',
    'trattamento',
    'smielatura',
    'nutrizione',
  ],
};

export interface TranscriptionResult {
  text: string;
  language: string | null;
  /** Token usage (if reported by the API) so we can charge against the monthly budget. */
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

function normalizeLanguage(lang: unknown): string | undefined {
  if (typeof lang !== 'string') return undefined;
  const short = lang.trim().toLowerCase().slice(0, 2);
  return SUPPORTED_LANGUAGES.has(short) ? short : undefined;
}

export async function transcribeAudio(params: {
  audio: Buffer;
  fileName: string;
  language?: string;
}): Promise<TranscriptionResult> {
  const language = normalizeLanguage(params.language);
  const contextBias = language ? CONTEXT_BIAS[language] : CONTEXT_BIAS.en;

  const response = await mistralClient.audio.transcriptions.complete({
    model: TRANSCRIPTION_MODEL,
    file: {
      fileName: params.fileName,
      content: params.audio,
    },
    language,
    contextBias,
    temperature: 0,
  });

  return {
    text: response.text ?? '',
    language: response.language ?? language ?? null,
    usage: {
      promptTokens: response.usage?.promptTokens ?? 0,
      completionTokens: response.usage?.completionTokens ?? 0,
    },
  };
}
