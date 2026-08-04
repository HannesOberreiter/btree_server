import { createHash, randomBytes } from 'node:crypto';

import type { FastifyRequest } from 'fastify';
import { UAParser } from 'ua-parser-js';

import type { Database } from '../../types/database.types.js';

function buildUserAgent(req: FastifyRequest) {
  try {
    const agent = UAParser(req.headers['user-agent']);
    const userAgentInsert =
      agent.os.name +
      agent.browser.name +
      agent.device.vendor +
      agent.device.model;
    return userAgentInsert.length > 65
      ? userAgentInsert.substring(0, 64)
      : userAgentInsert;
  } catch (error) {
    console.error(error);
    return 'noUserAgent';
  }
}

function createHashedPassword(password: string, hash = 'sha512') {
  // Preserve legacy client-side pre-hash compatibility.
  const hexInputPassword = createHash(hash).update(password).digest('hex');
  const salt = randomBytes(40).toString('hex');
  const saltedPassword = hexInputPassword + salt;
  const hashedPassword = createHash(hash).update(saltedPassword).digest('hex');
  return { salt, password: hashedPassword };
}

async function confirmAccount(db: Database, id: number) {
  await db
    .updateTable('bees')
    .set({ state: 1, reset: '' })
    .where('id', '=', id)
    .execute();
  const user = await db
    .selectFrom('bees')
    .select('email')
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
  return user.email;
}

async function unsubscribeMail(db: Database, id: number) {
  await db
    .updateTable('bees')
    .set({ newsletter: false })
    .where('id', '=', id)
    .execute();
  const user = await db
    .selectFrom('bees')
    .select('email')
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
  return user.email;
}

async function resetMail(db: Database, id: number) {
  await db
    .updateTable('bees')
    .set({
      reset: randomBytes(64).toString('hex'),
      reset_timestamp: new Date(),
    })
    .where('id', '=', id)
    .execute();
  return db
    .selectFrom('bees')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
}

async function resetPassword(db: Database, id: number, inputPassword: string) {
  const { salt, password } = createHashedPassword(inputPassword);
  // Password reset also confirms accounts for users missing activation mail.
  await db
    .updateTable('bees')
    .set({ reset: '', state: 1, password, salt })
    .where('id', '=', id)
    .execute();
  return db
    .selectFrom('bees')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
}

export {
  buildUserAgent,
  confirmAccount,
  createHashedPassword,
  resetMail,
  resetPassword,
  unsubscribeMail,
};
