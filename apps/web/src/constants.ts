export const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Deutsch', value: 'de' },
  { label: 'Français (Traduction automatique)', value: 'fr' },
  { label: 'Italiano (Traduzione automatica)', value: 'it' },
];
export const FORMATS = [
  { label: '13,37 / 05.01.1989', value: 1 },
  { label: '13.37 / 1989-05-01', value: 2 },
];

export const KINDS = [
  'filterEmpty',
  'checkup',
  'feed',
  'treatment',
  'harvest',
  'movedate',
] as const;

export const STATUS = ['both', 'open', 'done'] as const;

export const CALENDAR = [
  'rearing',
  'checkup',
  'feed',
  'treatment',
  'harvest',
  'todo',
  'movedate',
  'vis',
];
