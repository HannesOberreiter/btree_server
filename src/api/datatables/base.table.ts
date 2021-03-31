import { knexConfig } from '@config/environment.config';
import Knex from 'knex';

export class BaseTable {
  protected static db: any = Knex(knexConfig as Knex.Config);
}
