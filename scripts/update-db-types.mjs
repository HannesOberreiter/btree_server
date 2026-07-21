import { spawnSync } from 'node:child_process';
import process from 'node:process';

import dotenv from 'dotenv';

const environment = process.argv[2] ?? 'development';
const envPath = `env/${environment}.env`;
const result = dotenv.config({ path: envPath, quiet: true });
if (result.error) throw result.error;

const required = [
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_HOSTNAME',
  'DB_PORT',
  'DB_NAME',
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing ${name} in ${envPath}`);
}

const username = encodeURIComponent(process.env.DB_USERNAME);
const password = encodeURIComponent(process.env.DB_PASSWORD);
const databaseUrl = `mysql://${username}:${password}@${process.env.DB_HOSTNAME}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const command = spawnSync(
  'pnpm',
  [
    'exec',
    'kysely-codegen',
    '--dialect',
    'mysql',
    '--type-mapping',
    '{"tinyint":"ColumnType<boolean, boolean | number, boolean | number>"}',
    '--out-file',
    'src/types/db.types.ts',
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  },
);
if (command.status !== 0) process.exit(command.status ?? 1);

const format = spawnSync(
  'pnpm',
  ['exec', 'oxfmt', '--write', 'src/types/db.types.ts'],
  { stdio: 'inherit' },
);
process.exit(format.status ?? 1);
