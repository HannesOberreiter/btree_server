import type { ColumnType } from 'kysely';

export type Decimal = ColumnType<string, number | string>;

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export interface Point {
  x: number
  y: number
}

export interface Apiaries {
  /**
   * Creator
   */
  bee_id: Generated<number | null>
  created_at: Generated<Date | null>
  /**
   * if element is deleted (soft delete)
   */
  deleted: Generated<number | null>
  deleted_at: Generated<Date | null>
  description: Generated<string | null>
  /**
   * Editor
   */
  edit_id: Generated<number | null>
  id: Generated<number>
  latitude: Decimal
  longitude: Decimal
  /**
   * Active/Inactive
   */
  modus: Generated<number | null>
  name: Generated<string | null>
  note: Generated<string | null>
  updated_at: Generated<Date | null>
  /**
   * Connected Image Url or Webcam Url
   */
  url: Generated<string | null>
  /**
   * Company ID
   */
  user_id: Generated<number | null>
}

export interface Bees {
  /**
   * If VIS Date (AUSTRIA) is shown in calendar or not, also for newsletter reminder
   */
  acdate: Generated<number | null>
  created_at: Generated<Date | null>
  email: Generated<string | null>
  /**
   * User Date Format
   */
  format: Generated<string | null>
  id: Generated<number>
  lang: Generated<string | null>
  last_visit: Generated<Date | null>
  newsletter: Generated<number | null>
  /**
   * Send mail to user when bruteforce is detected
   */
  notice_bruteforce: Generated<Date | null>
  password: Generated<string | null>
  /**
   * Reminder email send for upcoming account deletion
   */
  reminder_deletion: Generated<Date | null>
  /**
   * Reminder email send for premium running out
   */
  reminder_premium: Generated<Date | null>
  /**
   * Reminder email send austrian VIS date
   */
  reminder_vis: Generated<Date | null>
  /**
   * Password reset key
   */
  reset: Generated<string | null>
  /**
   * Timestamp for Reseting Password, only allow a certain time
   */
  reset_timestamp: Generated<Date | null>
  salt: Generated<string | null>
  saved_company: Generated<number | null>
  /**
   * If user wants to sounds when action is saved succefully or on error etc
   */
  sound: Generated<number | null>
  /**
   * User Registration Source, 1=-; 2=Recommended by colleague; 3=Search Engine; 4=Social Media; 5=Ads; 6=Magazine; 7=App Store; Empty or other Text given
   */
  source: Generated<string | null>
  state: Generated<number | null>
  /**
   * If user want to allow horizontal scrolling in tables
   */
  tablexscroll: Generated<number | null>
  /**
   * 1 shows done todos in calendar 0 not
   */
  todo: Generated<number | null>
  updated_at: Generated<Date | null>
  username: Generated<string | null>
}

export interface CalendarCheckups {
  apiary_id: Generated<number>
  apiary_name: Generated<string | null>
  creators: Generated<string | null>
  date: Generated<Date | null>
  done: Generated<number | null>
  editors: Generated<string | null>
  enddate: Generated<Date | null>
  hive_ids: Generated<string | null>
  hive_names: Generated<string | null>
  task_ids: Generated<string | null>
  type_id: Generated<number | null>
  type_name: Generated<string | null>
  /**
   * Company
   */
  user_id: Generated<number | null>
}

export interface CalendarFeeds {
  apiary_id: Generated<number>
  apiary_name: Generated<string | null>
  creators: Generated<string | null>
  date: Generated<Date | null>
  done: Generated<number | null>
  editors: Generated<string | null>
  enddate: Generated<Date | null>
  hive_ids: Generated<string | null>
  hive_names: Generated<string | null>
  task_ids: Generated<string | null>
  type_id: Generated<number | null>
  type_name: Generated<string | null>
  /**
   * Company
   */
  user_id: Generated<number | null>
}

export interface CalendarHarvests {
  apiary_id: Generated<number>
  apiary_name: Generated<string | null>
  creators: Generated<string | null>
  date: Generated<Date | null>
  done: Generated<number | null>
  editors: Generated<string | null>
  enddate: Generated<Date | null>
  hive_ids: Generated<string | null>
  hive_names: Generated<string | null>
  task_ids: Generated<string | null>
  type_id: Generated<number | null>
  type_name: Generated<string | null>
  /**
   * Company
   */
  user_id: Generated<number | null>
}

export interface CalendarMovements {
  apiary_id: Generated<number | null>
  apiary_name: Generated<string | null>
  creators: Generated<string | null>
  date: Generated<string | null>
  editors: Generated<string | null>
  hive_ids: Generated<string | null>
  hive_names: Generated<string | null>
  move_ids: Generated<string | null>
  /**
   * Company ID
   */
  user_id: Generated<number | null>
}

export interface CalendarScaleData {
  average: Generated<Decimal | null>
  date: Generated<string | null>
  name: Generated<string | null>
  scale_id: Generated<number | null>
  user_id: Generated<number | null>
}

export interface CalendarTreatments {
  apiary_id: Generated<number>
  apiary_name: Generated<string | null>
  creators: Generated<string | null>
  date: Generated<Date | null>
  disease_id: Generated<number | null>
  disease_name: Generated<string | null>
  done: Generated<number | null>
  editors: Generated<string | null>
  enddate: Generated<Date | null>
  hive_ids: Generated<string | null>
  hive_names: Generated<string | null>
  task_ids: Generated<string | null>
  type_id: Generated<number | null>
  type_name: Generated<string | null>
  /**
   * Company
   */
  user_id: Generated<number | null>
}

export interface Charges {
  amount: Generated<Decimal | null>
  /**
   * Creator
   */
  bee_id: Generated<number | null>
  bestbefore: Generated<Date | null>
  calibrate: Generated<string | null>
  charge: Generated<string | null>
  created_at: Generated<Date | null>
  date: Generated<Date | null>
  /**
   * if element is deleted (soft delete)
   */
  deleted: Generated<number | null>
  deleted_at: Generated<Date | null>
  /**
   * Editor
   */
  edit_id: Generated<number | null>
  id: Generated<number>
  /**
   * out or in, for outgoing or incoming
   */
  kind: Generated<string | null>
  name: Generated<string | null>
  note: Generated<string | null>
  price: Generated<Decimal | null>
  type_id: Generated<number | null>
  updated_at: Generated<Date | null>
  url: Generated<string | null>
  /**
   * Company ID
   */
  user_id: Generated<number | null>
}

export interface ChargeStocks {
  sum: Generated<Decimal | null>
  sum_in: Generated<Decimal | null>
  sum_out: Generated<Decimal | null>
  type_id: Generated<number | null>
  /**
   * Company ID
   */
  user_id: Generated<number | null>
}

export interface ChargeTypes {
  created_at: Generated<Date | null>
  favorite: Generated<number | null>
  id: Generated<number>
  modus: Generated<number | null>
  name: Generated<string | null>
  unit: Generated<string | null>
  updated_at: Generated<Date | null>
  user_id: Generated<number | null>
}

export interface Checkups {
  /**
   * Creator
   */
  bee_id: Generated<number | null>
  brood: Generated<Decimal | null>
  broodframes: Generated<number | null>
  calm_comb: Generated<Decimal | null>
  capped_brood: Generated<number | null>
  comb: Generated<Decimal | null>
  created_at: Generated<Date | null>
  date: Generated<Date | null>
  /**
   * if element is deleted (soft delete)
   */
  deleted: Generated<number | null>
  deleted_at: Generated<Date | null>
  done: Generated<number | null>
  /**
   * Editor
   */
  edit_id: Generated<number | null>
  eggs: Generated<number | null>
  emptyframes: Generated<number | null>
  enddate: Generated<Date | null>
  foundation: Generated<number | null>
  hive_id: Generated<number | null>
  honeyframes: Generated<number | null>
  id: Generated<number>
  note: Generated<string | null>
  pollen: Generated<Decimal | null>
  queen: Generated<number | null>
  queencells: Generated<number | null>
  strong: Generated<number | null>
  swarm: Generated<Decimal | null>
  temper: Generated<Decimal | null>
  temperature: Generated<Decimal | null>
  time: Generated<string | null>
  type_id: Generated<number | null>
  updated_at: Generated<Date | null>
  url: Generated<string | null>
  /**
   * Company
   */
  user_id: Generated<number | null>
  varroa: Generated<Decimal | null>
  weight: Generated<Decimal | null>
}

export interface CheckupsApiaries {
  apiary_id: Generated<number>
  apiary_name: Generated<string | null>
  checkup_date: Generated<Date | null>
  checkup_id: Generated<number | null>
  /**
   * Company ID
   */
  user_id: Generated<number | null>
}

export interface CheckupTypes {
  created_at: Generated<Date | null>
  favorite: Generated<number | null>
  id: Generated<number>
  modus: Generated<number | null>
  name: Generated<string | null>
  updated_at: Generated<Date | null>
  user_id: Generated<number | null>
}

export interface Companies {
  /**
   * If API Key is active or not
   */
  api_active: Generated<number | null>
  /**
   * API Key to Access ICAL and Scale API
   */
  api_key: Generated<string | null>
  created_at: Generated<Date | null>
  id: Generated<number>
  /**
   * User Upload Folder Name
   */
  image: Generated<string | null>
  name: Generated<string | null>
  /**
   * How long premium account is paid for
   */
  paid: Generated<Date | null>
  updated_at: Generated<Date | null>
}

export interface CompanyBee {
  bee_id: Generated<number | null>
  id: Generated<number>
  /**
   * Rank of the User, eg. read-only, user and admin
   */
  rank: Generated<number | null>
  user_id: Generated<number | null>
}

export interface Counts {
  count: Generated<Decimal | null>
  kind: Generated<string>
  user_id: Generated<number | null>
}

export interface Dropbox {
  access_token: Generated<string | null>
  id: Generated<number>
  refresh_token: Generated<string | null>
  user_id: Generated<number | null>
}

export interface FederatedCredentials {
  bee_id: Generated<number | null>
  created_at: Generated<Date | null>
  id: Generated<number>
  last_visit: Generated<Date | null>
  mail: string
  provider: string
  provider_id: Generated<string | null>
}

export interface Feeds {
  amount: Generated<Decimal | null>
  /**
   * Creator
   */
  bee_id: Generated<number | null>
  created_at: Generated<Date | null>
  date: Generated<Date | null>
  /**
   * if element is deleted (soft delete)
   */
  deleted: Generated<number | null>
  deleted_at: Generated<Date | null>
  done: Generated<number | null>
  /**
   * Editor
   */
  edit_id: Generated<number | null>
  enddate: Generated<Date | null>
  hive_id: Generated<number | null>
  id: Generated<number>
  note: Generated<string | null>
  type_id: Generated<number | null>
  updated_at: Generated<Date | null>
  url: Generated<string | null>
  /**
   * Company
   */
  user_id: Generated<number | null>
}

export interface FeedsApiaries {
  apiary_id: Generated<number>
  apiary_name: Generated<string | null>
  feed_date: Generated<Date | null>
  feed_id: Generated<number | null>
  /**
   * Company ID
   */
  user_id: Generated<number | null>
}

export interface FeedTypes {
  created_at: Generated<Date | null>
  favorite: Generated<number | null>
  id: Generated<number>
  modus: Generated<number | null>
  name: Generated<string | null>
  updated_at: Generated<Date | null>
  user_id: Generated<number | null>
}

export interface FieldSettings {
  bee_id: Generated<number | null>
  id: Generated<number>
  /**
   * Object contains tablename, field, boolean to indicate if field should be visible in frontend or not.
   */
  settings: Generated<string | null>
}

export interface Harvests {
  amount: Generated<Decimal | null>
  /**
   * Creator
   */
  bee_id: Generated<number | null>
  charge: Generated<string | null>
  created_at: Generated<Date | null>
  date: Generated<Date | null>
  /**
   * if element is deleted (soft delete)
   */
  deleted: Generated<number | null>
  deleted_at: Generated<Date | null>
  done: Generated<number | null>
  /**
   * Editor
   */
  edit_id: Generated<number | null>
  enddate: Generated<Date | null>
  frames: Generated<Decimal | null>
  hive_id: Generated<number | null>
  id: Generated<number>
  note: Generated<string | null>
  type_id: Generated<number | null>
  updated_at: Generated<Date | null>
  url: Generated<string | null>
  /**
   * Company
   */
  user_id: Generated<number | null>
  water: Generated<Decimal | null>
}

export interface HarvestsApiaries {
  apiary_id: Generated<number>
  apiary_name: Generated<string | null>
  harvest_date: Generated<Date | null>
  harvest_id: Generated<number | null>
  /**
   * Company ID
   */
  user_id: Generated<number | null>
}

export interface HarvestTypes {
  created_at: Generated<Date | null>
  favorite: Generated<number | null>
  id: Generated<number>
  modus: Generated<number | null>
  name: Generated<string | null>
  updated_at: Generated<Date | null>
  user_id: Generated<number | null>
}

export interface Hives {
  /**
   * Creator
   */
  bee_id: Generated<number | null>
  created_at: Generated<Date | null>
  /**
   * if element is deleted (soft delete)
   */
  deleted: Generated<number | null>
  deleted_at: Generated<Date | null>
  /**
   * Editor
   */
  edit_id: Generated<number | null>
  grouphive: Generated<number | null>
  id: Generated<number>
  modus: Generated<number | null>
  /**
   * Date keeps track when modus changes to inactive.
   */
  modus_date: Generated<Date | null>
  name: Generated<string | null>
  note: Generated<string | null>
  position: Generated<number | null>
  source_id: Generated<number | null>
  type_id: Generated<number | null>
  updated_at: Generated<Date | null>
  /**
   * Company
   */
  user_id: Generated<number | null>
}

export interface HivesCounts {
  apiary_name: Generated<string | null>
  count: Generated<number>
  grouphivescount: Generated<Decimal | null>
  id: Generated<number>
}

export interface HivesLocations {
  apiary_id: Generated<number>
  apiary_name: Generated<string | null>
  /**
   * if element is deleted (soft delete)
   */
  hive_deleted: Generated<number | null>
  hive_id: Generated<number | null>
  hive_modus: Generated<number | null>
  hive_name: Generated<string | null>
  move_id: Generated<number | null>
  /**
   * Company ID
   */
  user_id: Generated<number | null>
}

export interface HiveSources {
  created_at: Generated<Date | null>
  favorite: Generated<number | null>
  id: Generated<number>
  modus: Generated<number | null>
  name: Generated<string | null>
  updated_at: Generated<Date | null>
  user_id: Generated<number | null>
}

export interface HiveTypes {
  created_at: Generated<Date | null>
  favorite: Generated<number | null>
  id: Generated<number>
  modus: Generated<number | null>
  name: Generated<string | null>
  updated_at: Generated<Date | null>
  user_id: Generated<number | null>
}

export interface KnexMigrations {
  batch: Generated<number | null>
  id: Generated<number>
  migration_time: Generated<Date>
  name: Generated<string | null>
}

export interface KnexMigrationsLock {
  index: Generated<number>
  is_locked: Generated<number | null>
}

export interface LoginAttempts {
  bee_id: Generated<number | null>
  id: Generated<number>
  time: Generated<Date | null>
}

export interface Movedates {
  apiary_id: Generated<number | null>
  /**
   * Creator
   */
  bee_id: Generated<number | null>
  created_at: Generated<Date | null>
  date: Generated<Date | null>
  /**
   * Editor
   */
  edit_id: Generated<number | null>
  hive_id: Generated<number | null>
  id: Generated<number>
  updated_at: Generated<Date | null>
}

export interface MovedatesCounts {
  count: Generated<number>
  hive_id: Generated<number | null>
}

export interface MovedatesPreviousApiary {
  current_move_date: Generated<Date | null>
  current_move_id: Generated<number | null>
  hive_id: Generated<number | null>
  previous_apiary_id: Generated<number | null>
  previous_apiary_name: Generated<string | null>
}

export interface Observations {
  created_at: Generated<Date | null>
  data: Generated<string | null>
  external_id: Generated<number | null>
  external_service: Generated<string | null>
  external_uuid: Generated<string | null>
  id: Generated<number>
  location: Generated<Point | null>
  observed_at: Generated<Date | null>
  taxa: Generated<string | null>
  updated_at: Generated<Date | null>
}

export interface Payments {
  amount: Generated<Decimal | null>
  date: Generated<Date | null>
  id: Generated<number>
  months: Generated<number | null>
  type: Generated<string | null>
  /**
   * Company ID
   */
  user_id: Generated<number | null>
}

export interface Promos {
  code: Generated<string | null>
  date: Generated<Date | null>
  id: Generated<number>
  months: Generated<number | null>
  /**
   * If code is already used
   */
  used: Generated<number | null>
  /**
   * user_id for which companies the code was used, no FK needed
   */
  user_id: Generated<number | null>
}

export interface QueenDurations {
  duration: Generated<number | null>
  hive_id: Generated<number | null>
  id: Generated<number>
  last_date: Generated<Date>
  move_date: Generated<Date | null>
  user_id: Generated<number | null>
}

export interface QueenMatings {
  created_at: Generated<Date | null>
  favorite: Generated<number | null>
  id: Generated<number>
  modus: Generated<number | null>
  name: Generated<string | null>
  updated_at: Generated<Date | null>
  user_id: Generated<number | null>
}

export interface QueenRaces {
  created_at: Generated<Date | null>
  favorite: Generated<number | null>
  id: Generated<number>
  modus: Generated<number | null>
  name: Generated<string | null>
  updated_at: Generated<Date | null>
  user_id: Generated<number | null>
}

export interface Queens {
  /**
   * Creator
   */
  bee_id: Generated<number | null>
  created_at: Generated<Date | null>
  date: Generated<Date | null>
  /**
   * if element is deleted (soft delete)
   */
  deleted: Generated<number | null>
  deleted_at: Generated<Date | null>
  /**
   * Editor
   */
  edit_id: Generated<number | null>
  hive_id: Generated<number | null>
  id: Generated<number>
  mark_colour: Generated<string | null>
  mating_id: Generated<number | null>
  modus: Generated<number | null>
  /**
   * Keep track of when queen was set inactive.
   */
  modus_date: Generated<Date | null>
  mother: Generated<string | null>
  mother_id: Generated<number | null>
  move_date: Generated<Date | null>
  name: Generated<string | null>
  note: Generated<string | null>
  race_id: Generated<number | null>
  updated_at: Generated<Date | null>
  url: Generated<string | null>
  user_id: Generated<number | null>
}

export interface QueensLocations {
  hive_id: Generated<number>
  hive_name: Generated<string | null>
  queen_id: Generated<number | null>
  queen_mark_colour: Generated<string | null>
  queen_modus: Generated<number | null>
  /**
   * Keep track of when queen was set inactive.
   */
  queen_modus_date: Generated<Date | null>
  queen_move_date: Generated<Date | null>
  queen_name: Generated<string | null>
}

export interface RearingDetails {
  hour: Generated<number | null>
  id: Generated<number>
  job: Generated<string | null>
  note: Generated<string | null>
  user_id: Generated<number | null>
}

export interface Rearings {
  /**
   * Creator
   */
  bee_id: Generated<number | null>
  created_at: Generated<Date | null>
  date: Generated<Date | null>
  /**
   * Starting Step
   */
  detail_id: Generated<number | null>
  /**
   * Editor
   */
  edit_id: Generated<number | null>
  hatch: Generated<number | null>
  id: Generated<number>
  larvae: Generated<number | null>
  mated: Generated<number | null>
  name: Generated<string | null>
  note: Generated<string | null>
  symbol: Generated<string | null>
  type_id: Generated<number | null>
  updated_at: Generated<Date | null>
  user_id: Generated<number | null>
}

export interface RearingSteps {
  detail_id: Generated<number | null>
  id: Generated<number>
  /**
   * Step position for rearings
   */
  position: Generated<number | null>
  /**
   * Sleep h after step
   */
  sleep_after: Generated<number | null>
  /**
   * Sleep h before step
   */
  sleep_before: Generated<number | null>
  type_id: Generated<number | null>
}

export interface RearingTypes {
  id: Generated<number>
  name: Generated<string | null>
  note: Generated<string | null>
  user_id: Generated<number | null>
}

export interface RefreshTokens {
  'bee_id': Generated<number | null>
  'expires': Generated<Date>
  'id': Generated<number>
  'token': Generated<string | null>
  'user_id': Generated<number | null>
  'user-agent': Generated<string | null>
}

export interface ScaleData {
  datetime: Generated<Date | null>
  humidity: Generated<Decimal | null>
  id: Generated<number>
  note: Generated<string | null>
  rain: Generated<Decimal | null>
  scale_id: Generated<number | null>
  temp1: Generated<Decimal | null>
  temp2: Generated<Decimal | null>
  weight: Generated<Decimal | null>
}

export interface Scales {
  hive_id: Generated<number | null>
  id: Generated<number>
  name: Generated<string | null>
  user_id: Generated<number | null>
}

export interface StatsHivesFeeds {
  hive_id: Generated<number | null>
  hive_name: Generated<string | null>
  quarter: Generated<number | null>
  sum_amount: Generated<Decimal | null>
  type_id: Generated<number>
  type_name: Generated<string | null>
  /**
   * Company
   */
  user_id: Generated<number | null>
  year: Generated<number | null>
}

export interface StatsHivesHarvests {
  hive_id: Generated<number | null>
  hive_name: Generated<string | null>
  quarter: Generated<number | null>
  sum_amount: Generated<Decimal | null>
  sum_frames: Generated<Decimal | null>
  type_id: Generated<number>
  type_name: Generated<string | null>
  /**
   * Company
   */
  user_id: Generated<number | null>
  year: Generated<number | null>
}

export interface Todos {
  /**
   * Creator
   */
  bee_id: Generated<number | null>
  created_at: Generated<Date | null>
  date: Generated<Date | null>
  done: Generated<number | null>
  /**
   * Editor
   */
  edit_id: Generated<number | null>
  id: Generated<number>
  name: Generated<string | null>
  note: Generated<string | null>
  updated_at: Generated<Date | null>
  url: Generated<string | null>
  user_id: Generated<number | null>
}

export interface TreatmentDiseases {
  created_at: Generated<Date | null>
  favorite: Generated<number | null>
  id: Generated<number>
  modus: Generated<number | null>
  name: Generated<string | null>
  updated_at: Generated<Date | null>
  user_id: Generated<number | null>
}

export interface Treatments {
  amount: Generated<Decimal | null>
  /**
   * Creator
   */
  bee_id: Generated<number | null>
  created_at: Generated<Date | null>
  date: Generated<Date | null>
  /**
   * if element is deleted (soft delete)
   */
  deleted: Generated<number | null>
  deleted_at: Generated<Date | null>
  disease_id: Generated<number | null>
  done: Generated<number | null>
  /**
   * Editor
   */
  edit_id: Generated<number | null>
  enddate: Generated<Date | null>
  hive_id: Generated<number | null>
  id: Generated<number>
  note: Generated<string | null>
  /**
   * Temperature input field
   */
  temperature: Generated<Decimal | null>
  type_id: Generated<number | null>
  updated_at: Generated<Date | null>
  url: Generated<string | null>
  /**
   * Company
   */
  user_id: Generated<number | null>
  vet_id: Generated<number | null>
  wait: Generated<number | null>
}

export interface TreatmentsApiaries {
  apiary_id: Generated<number>
  apiary_name: Generated<string | null>
  treatment_date: Generated<Date | null>
  treatment_id: Generated<number | null>
  /**
   * Company ID
   */
  user_id: Generated<number | null>
}

export interface TreatmentTypes {
  created_at: Generated<Date | null>
  favorite: Generated<number | null>
  id: Generated<number>
  modus: Generated<number | null>
  name: Generated<string | null>
  updated_at: Generated<Date | null>
  user_id: Generated<number | null>
}

export interface TreatmentVets {
  created_at: Generated<Date | null>
  favorite: Generated<number | null>
  id: Generated<number>
  modus: Generated<number | null>
  name: Generated<string | null>
  note: Generated<string | null>
  updated_at: Generated<Date | null>
  user_id: Generated<number | null>
}

export interface WizbeeTokens {
  bee_id: Generated<number | null>
  countQuestions: Generated<number | null>
  created_at: Generated<Date | null>
  date: Generated<Date | null>
  id: Generated<number>
  updated_at: Generated<Date | null>
  usedTokens: Generated<number | null>
}

export interface DB {
  apiaries: Apiaries
  bees: Bees
  calendar_checkups: CalendarCheckups
  calendar_feeds: CalendarFeeds
  calendar_harvests: CalendarHarvests
  calendar_movements: CalendarMovements
  calendar_scale_data: CalendarScaleData
  calendar_treatments: CalendarTreatments
  charge_stocks: ChargeStocks
  charge_types: ChargeTypes
  charges: Charges
  checkup_types: CheckupTypes
  checkups: Checkups
  checkups_apiaries: CheckupsApiaries
  companies: Companies
  company_bee: CompanyBee
  counts: Counts
  dropbox: Dropbox
  federated_credentials: FederatedCredentials
  feed_types: FeedTypes
  feeds: Feeds
  feeds_apiaries: FeedsApiaries
  field_settings: FieldSettings
  harvest_types: HarvestTypes
  harvests: Harvests
  harvests_apiaries: HarvestsApiaries
  hive_sources: HiveSources
  hive_types: HiveTypes
  hives: Hives
  hives_counts: HivesCounts
  hives_locations: HivesLocations
  KnexMigrations: KnexMigrations
  KnexMigrations_lock: KnexMigrationsLock
  login_attempts: LoginAttempts
  movedates: Movedates
  movedates_counts: MovedatesCounts
  movedates_previous_apiary: MovedatesPreviousApiary
  observations: Observations
  payments: Payments
  promos: Promos
  queen_durations: QueenDurations
  queen_matings: QueenMatings
  queen_races: QueenRaces
  queens: Queens
  queens_locations: QueensLocations
  rearing_details: RearingDetails
  rearing_steps: RearingSteps
  rearing_types: RearingTypes
  rearings: Rearings
  refresh_tokens: RefreshTokens
  scale_data: ScaleData
  scales: Scales
  stats_hives_feeds: StatsHivesFeeds
  stats_hives_harvests: StatsHivesHarvests
  todos: Todos
  treatment_diseases: TreatmentDiseases
  treatment_types: TreatmentTypes
  treatment_vets: TreatmentVets
  treatments: Treatments
  treatments_apiaries: TreatmentsApiaries
  wizbee_tokens: WizbeeTokens
}
