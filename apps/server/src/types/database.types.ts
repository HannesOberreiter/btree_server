import type { Kysely, Transaction } from 'kysely';

import type { DB } from './db.types.js';

export type Database = Kysely<DB> | Transaction<DB>;
