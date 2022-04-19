declare interface Company {
  id: number;
  name: string;
  paid: Date;
  rank: number;
  api_active: boolean;
}
declare interface User {
  email?: string;
  password?: string;
  acdate?: boolean;
  format?: number;
  lang?: string;
  id?: number;
  firstname?: string;
  lastname?: string;
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

declare interface RegisterUser {
  company: string;
  email: string;
  password: string;
  confirmPasswort: string;
  lang: string;
  source: string;
  otherSource: string;
  newsletter?: boolean;
  terms?: boolean;
}

declare interface Status {
  loggedIn: boolean;
}
declare interface State {
  status: Status;
  user: User | null;
  company: Company | null;
}

declare interface refreshToken {
  expires: Date;
  token: string;
}

declare interface Token {
  accessToken: string;
  expiresIn: number;
  refreshToken: refreshToken;
  tokenType: string;
}

declare interface Todo {
  date: string;
  name: string;
  note: string;
}

declare interface Apiary {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  note: string;
  url: string;
  modus: boolean;
}

type Option =
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
  | 'apiary'
  | 'hive'
  | 'queen';

type TextField =
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

type Task = 'feed' | 'harvest' | 'treatment' | 'checkup';

declare interface FormHive {
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

declare interface FormTodo {
  date: string;
  name: string;
  note: string;
  done: boolean;
  interval: number;
  repeat: number;
}

declare interface FormCharge {
  bestbefore: string;
  date: string;
  name: string;
  charge: string;
  price: number;
  amount: number;
  unit: string;
  note: string;
  url: string;
  kind: 'in' | 'out';
  type: any;
}

declare interface FormQueen {
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

declare interface FormQuicktool {
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
  checkup_temp: number;
  harvest_frames: number;
  harvest_amount_type: string;
  harvest_amount_calc: number;
  harvest_water: number;
  harvest_charge: string;
  treatment_wait: number;
  hive: any;
  type: any;
  disease: any;
  treatment_vet: any;
}

export {
  User,
  Company,
  Status,
  State,
  RegisterUser,
  Token,
  Task,
  Todo,
  Apiary,
  Option,
  TextField,
  FormHive,
  FormCharge,
  FormQueen,
  FormQuicktool,
  FormTodo,
};
