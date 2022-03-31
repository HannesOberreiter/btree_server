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
  | 'treatment_vets';

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
};
