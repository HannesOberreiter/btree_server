import process from 'node:process';

import { runManualCron } from './services/manual-cron.service.js';

try {
  await runManualCron();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
