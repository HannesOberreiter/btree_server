import { execFile } from 'node:child_process';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

import openapiTS, { astToString } from 'openapi-typescript';

const specUrl =
  process.env.BTREE_OPENAPI_URL ?? 'http://localhost:8101/api/v1/openapi.json';
const outputPath = resolve('src/api/generated/schema.d.ts');
const temporaryPath = resolve('src/api/generated/schema.tmp.d.ts');
const formatFile = promisify(execFile);

const response = await fetch(specUrl);
if (!response.ok) {
  throw new Error(
    `Could not fetch OpenAPI specification: ${response.status} ${response.statusText}`
  );
}

const specification = await response.json();
if (
  typeof specification !== 'object' ||
  specification === null ||
  typeof specification.openapi !== 'string' ||
  typeof specification.paths !== 'object' ||
  specification.paths === null
) {
  throw new Error('Server returned an invalid OpenAPI specification');
}

const ast = await openapiTS(specification, { alphabetize: true });
const generatedSource =
  '/* eslint-disable typescript/no-redundant-type-constituents -- generated OpenAPI types */\n' +
  astToString(ast);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(temporaryPath, generatedSource, 'utf8');
await formatFile(resolve('node_modules/.bin/oxfmt'), [
  '--write',
  temporaryPath
]);
await rename(temporaryPath, outputPath);

console.log(`Generated ${outputPath} from ${specUrl}`);
