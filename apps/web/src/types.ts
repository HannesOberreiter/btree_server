import type { KINDS, KINDS_APIARY, STATUS } from './constants';
import { z } from 'zod';

export const beeSchema = z
  .object({
    id: z.number(),
    email: z.string().nullable(),
    username: z.string().nullable()
  })
  .nullable();

export type Bee = z.infer<typeof beeSchema>;

export const todoResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  date: z.string(), // Date as ISO string
  note: z.string().nullable(),
  url: z.string().nullable(),
  done: z.boolean(),
  bee_id: z.number().nullable(),
  edit_id: z.number().nullable(),
  user_id: z.number().nullable(),
  apiary_id: z.number().nullable(),
  created_at: z.string().nullable(), // Date as ISO string
  updated_at: z.string().nullable(), // Date as ISO string
  creator: beeSchema.optional(),
  editor: beeSchema.optional(),
  apiary: z
    .object({
      name: z.string(),
      modus: z.boolean()
    })
    .nullable()
    .optional()
});

export type TodoResponse = z.infer<typeof todoResponseSchema>;

export const todoPaginatedResponseSchema = z.object({
  results: z.array(todoResponseSchema),
  total: z.number()
});

export type TodoPaginatedResponse = z.infer<typeof todoPaginatedResponseSchema>;

export type FilterState = (typeof STATUS)[number];
export type Filter = (typeof KINDS)[number];
export type FilterApiary = (typeof KINDS_APIARY)[number];
export declare interface Company {
  id: number;
  name: string;
  paid: Date;
  rank: number;
  api_active: boolean;
}
export declare interface User {
  email?: string;
  password?: string;
  acdate?: boolean;
  format?: 'DD.MM.YYYY' | 'YYYY-MM-DD';
  lang?: string;
  id?: number;
  username?: string;
  saved_company?: number;
  sound?: boolean;
  newsletter?: boolean;
  state?: boolean;
  todo?: boolean;
  accessToken?: string;
  source?: string;
  otherSource?: string;
  company: Company[];
}

export declare interface RegisterUser {
  company: string;
  email: string;
  password: string;
  confirmPasswort: string;
  lang: string;
  format: 'DD.MM.YYYY' | 'YYYY-MM-DD';
  source: string;
  otherSource: string;
  newsletter?: boolean;
  terms?: boolean;
  isOAuth?: boolean;
}

export declare interface Status {
  loggedIn: boolean;
}
export declare interface State {
  status: Status;
  user: User | null;
  company: Company | null;
}

export declare interface refreshToken {
  expires: Date;
  token: string;
}

export declare interface Token {
  accessToken: string;
  expiresIn: number;
  refreshToken: refreshToken;
  tokenType: string;
}

export declare interface Todo {
  date: string;
  name: string;
  note: string;
}

export declare interface Apiary {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  elevation: number | null;
  note: string;
  url: string;
  modus: boolean;
}

export type Option =
  | 'charge_types'
  | 'hive_sources'
  | 'hive_types'
  | 'feed_types'
  | 'harvest_types'
  | 'checkup_types'
  | 'queen_matings'
  | 'queen_races'
  | 'treatment_diseases'
  | 'treatment_types'
  | 'treatment_vets'
  | 'rearing_detail'
  | 'apiary'
  | 'hive'
  | 'queen'
  | 'scale';

export type TextField =
  | 'number'
  | 'search'
  | 'textarea'
  | 'time'
  | 'text'
  | 'password'
  | 'email'
  | 'tel'
  | 'file'
  | 'url'
  | 'date';

export type Task = 'feed' | 'harvest' | 'treatment' | 'checkup';

export declare interface FormHive {
  name: string;
  date: string;
  position: number;
  grouphive: number;
  note: string;
  modus: boolean;
  modusDate: string;
  start: number;
  repeat: number;
  apiary: any;
  type: any;
  source: any;
}

export declare interface FormTodo {
  date: string;
  name: string;
  note: string;
  done: boolean;
  url: string;
  interval: number;
  repeat: number;
  apiary: any;
}

export declare interface FormOption {
  name: string;
  modus: boolean;
  favorite: boolean;
  note: string;
  unit: string;
}

export declare interface FormRearingDetail {
  job: string;
  note: string;
}

export declare interface FormRearingType {
  name: string;
  note: string;
}

export declare interface FormRearing {
  name: string;
  symbol: string;
  larvae: number;
  hatch: number;
  mated: number;
  note: string;
  date: string;
  type: any;
  detail: any;
}

export declare interface FormCharge {
  bestbefore: string;
  date: string;
  name: string;
  charge: string;
  price: number;
  amount: number;
  note: string;
  url: string;
  kind: 'in' | 'out';
  type: any;
}

export declare interface FormQueenHive {
  move_date: string;
  hive: any;
}

export declare interface FormQueen {
  name: string;
  date: string;
  mark_colour: string;
  move_date: string;
  mother: string;
  note: string;
  url: string;
  modus: boolean;
  modusDate: string;
  start: number;
  repeat: number;
  hive: any;
  mating: any;
  race: any;
  mother_id: any;
}

export declare interface FormScale {
  name: string;
  hive: any;
}

export declare interface FormScaleData {
  datetime: string;
  weight: number;
  temp1: number;
  temp2: number;
  rain: number;
  humidity: number;
  note: string;
  scale: any;
}

export declare interface FormQuicktool {
  date: string;
  enddate: string;
  interval: number;
  repeat: number;
  amount: number;
  amount_type: string;
  amount_calc: number;
  url: string;
  note: string;
  done: boolean;
  checkup_queen: any;
  checkup_rating: {
    brood: number;
    pollen: number;
    comb: number;
    temper: number;
    calm_comb: number;
    swarm: number;
  };
  checkup_frames: {
    broodframes: number;
    honeyframes: number;
    foundation: number;
    emptyframes: number;
  };
  checkup_varroa: number;
  checkup_strong: number;
  checkup_weight_amount: number;
  checkup_weight_time: string;
  checkup_temperature: number;
  harvest_frames: number;
  harvest_amount_type: string;
  harvest_amount_calc: number;
  harvest_water: number;
  harvest_charge: string;
  treatment_wait: number;
  treatment_temperature: number;
  hive: any;
  type: any;
  disease: any;
  treatment_vet: any;
  treatment_disease: any;
}
