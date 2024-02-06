import { KINDS, STATUS } from '~/constants';

export type FilterState = (typeof STATUS)[number];
export type Filter = (typeof KINDS)[number];
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
