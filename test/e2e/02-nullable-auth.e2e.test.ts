import type { FastifyReply, FastifyRequest } from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserController from '../../src/api/controllers/user.controller.js';
import { buildUserAgent } from '../../src/api/modules/auth.module.js';
import { fetchUser, getPaidRank } from '../../src/api/modules/login.module.js';

vi.mock('../../src/servers/kysely.server.js', () => ({
  KyselyServer: { getInstance: () => ({ db: {} }) },
}));
vi.mock('../../src/servers/redis.server.js', () => ({
  RedisServer: { client: {} },
}));
vi.mock('../../src/services/mail.service.js', () => ({
  MailService: { getInstance: vi.fn() },
}));
vi.mock('../../src/api/modules/account_deletion.module.js', () => ({
  deleteCompany: vi.fn(),
  deleteUser: vi.fn(),
}));
vi.mock('../../src/api/modules/login.module.js', () => ({
  fetchUser: vi.fn(),
  getPaidRank: vi.fn(),
  reviewPassword: vi.fn(),
}));

function request() {
  return {
    headers: { 'user-agent': 'unrecognized-test-agent' },
    ip: '127.0.0.1',
    session: {
      user: { bee_id: 7 },
      regenerate: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    },
  } as unknown as FastifyRequest;
}
const reply = {} as FastifyReply;

function account(): NonNullable<Awaited<ReturnType<typeof fetchUser>>> {
  return {
    id: 7,
    email: 'beekeeper@example.test',
    username: null,
    saved_company: null,
    password: null,
    salt: null,
    state: 1,
    lang: null,
    format: null,
    sound: null,
    todo: null,
    acdate: null,
    newsletter: null,
    company: [
      { id: 42, name: 'First', paid: null, api_active: false, rank: 1 },
      { id: 43, name: 'Second', paid: null, api_active: false, rank: 2 },
    ],
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fetchUser).mockResolvedValue(account());
  vi.mocked(getPaidRank).mockResolvedValue({ rank: 1, paid: false });
});

describe('nullable authenticated account data', () => {
  it('rejects a missing account before regenerating its session', async () => {
    vi.mocked(fetchUser).mockResolvedValue(undefined);
    const req = request();

    await expect(UserController.get(req, reply)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(req.session.regenerate).not.toHaveBeenCalled();
    expect(getPaidRank).not.toHaveBeenCalled();
  });

  it('rejects an account without workspace membership', async () => {
    vi.mocked(fetchUser).mockResolvedValue({ ...account(), company: [] });
    const req = request();

    await expect(UserController.get(req, reply)).rejects.toMatchObject({
      statusCode: 401,
      message: 'no company',
    });
    expect(req.session.regenerate).not.toHaveBeenCalled();
    expect(getPaidRank).not.toHaveBeenCalled();
  });

  it.each([
    [null, 42],
    [999, 42],
    [43, 43],
  ])(
    'selects a valid workspace when saved_company is %s',
    async (saved, expected) => {
      vi.mocked(fetchUser).mockResolvedValue({
        ...account(),
        saved_company: saved,
      });
      const req = request();

      await UserController.get(req, reply);

      expect(getPaidRank).toHaveBeenCalledWith(expect.anything(), 7, expected);
      expect(req.session.user.user_id).toBe(expected);
      expect(req.session.user.bee_id).toBe(7);
      expect(req.session.save).toHaveBeenCalledOnce();
    },
  );

  it('uses a stable fallback for an unrecognized user agent', () => {
    expect(buildUserAgent(request())).toBe('noUserAgent');
  });
});
