export const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Deutsch', value: 'de' },
  { label: 'Français (Traduction automatique)', value: 'fr' },
  { label: 'Italiano (Traduzione automatica)', value: 'it' }
];
export const FORMATS = [
  { label: '05.01.1989', value: 'DD.MM.YYYY' },
  { label: '1989-05-01', value: 'YYYY-MM-DD' }
];

export const KINDS = [
  'filterEmpty',
  'checkup',
  'feed',
  'treatment',
  'harvest',
  'movedate'
] as const;
export const KINDS_APIARY = [...KINDS, 'todo'] as const;

export const STATUS = ['both', 'open', 'done'] as const;

export const CALENDAR = [
  'rearing',
  'checkup',
  'feed',
  'treatment',
  'harvest',
  'todo',
  'movedate',
  'vis'
];

export const OPTIONS = [
  'charge_types',
  'hive_sources',
  'hive_types',
  'feed_types',
  'harvest_types',
  'checkup_types',
  'queen_matings',
  'queen_races',
  'treatment_diseases',
  'treatment_types',
  'treatment_vets',
  'wax_products',
  'wax_origin_types',
  'rearing_detail'
] as const;

export const API_SERVER = {
  eu: 'Europe (Frankfurt, Germany) [DEFAULT]',
  us: 'America (US-West) (Hillsboro, Oregon)'
} as const;
