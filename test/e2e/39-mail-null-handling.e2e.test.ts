import type { SendMailOptions } from 'nodemailer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MailService } from '../../src/services/mail.service.js';

const mocks = vi.hoisted(() => ({
  env: 'production',
  readFileSync: vi.fn<(path: string, encoding: string) => string>(),
  sendMail:
    vi.fn<
      (
        options: SendMailOptions,
      ) => Promise<{ response: string; rejected?: string[] }>
    >(),
  close: vi.fn(),
  log: vi.fn(),
}));

vi.mock('node:fs', () => ({ readFileSync: mocks.readFileSync }));
vi.mock('nodemailer', () => ({
  createTransport: () => ({ sendMail: mocks.sendMail, close: mocks.close }),
  createTestAccount: vi.fn(),
  getTestMessageUrl: vi.fn(),
}));
vi.mock('../../src/config/environment.config.js', () => ({
  get env() {
    return mocks.env;
  },
  frontend: 'https://frontend.example',
  rootDirectory: '/mock',
  serverLocation: 'eu',
  mailConfig: { host: 'mock' },
}));
vi.mock('../../src/services/logger.service.js', () => ({
  Logger: { getInstance: () => ({ log: mocks.log }) },
}));

const recipient = 'beekeeper@example.com';
const template =
  '<title>Mail title</title>Beekeeper Imker/in apicoltore apiculteur %key% %lang% %mail% %base_url% %params% %amount%';

beforeEach(async () => {
  vi.resetAllMocks();
  mocks.env = 'production';
  mocks.readFileSync.mockImplementation((path) =>
    path.includes('/partials/') ? ' footer' : template,
  );
  mocks.sendMail.mockResolvedValue({ response: 'OK', rejected: [] });
  await MailService.getInstance().setup();
});

describe('MailService nullable inputs', () => {
  it('does not load templates or send when the recipient is null', async () => {
    await expect(
      MailService.getInstance().sendMail({
        to: null,
        lang: null,
        subject: 'reset',
        name: null,
        key: null,
      }),
    ).resolves.toBe(false);
    expect(mocks.readFileSync).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it.each([null, 'unknown'])(
    'falls back to English for language %s',
    async (lang) => {
      await expect(
        MailService.getInstance().sendMail({
          to: recipient,
          lang,
          subject: 'reset',
          name: null,
          key: null,
        }),
      ).resolves.toBe(true);
      expect(mocks.readFileSync).toHaveBeenNthCalledWith(
        1,
        '/mock/mails/reset_en.txt',
        'utf-8',
      );
      expect(mocks.readFileSync).toHaveBeenNthCalledWith(
        2,
        '/mock/mails/partials/footer_en.txt',
        'utf-8',
      );
      expect(mocks.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: recipient,
          subject: 'Mail title',
          text: `Beekeeper Imker/in apicoltore apiculteur %key% en ${recipient} https://frontend.example/ ?server=eu %amount% footer`,
        }),
      );
    },
  );

  it.each([undefined, null, 'false'])(
    'treats key %s as absent',
    async (key) => {
      await MailService.getInstance().sendMail({
        to: recipient,
        lang: 'en',
        subject: 'reset',
        key,
      });
      expect(mocks.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining('%key%') }),
      );
    },
  );

  it.each([
    ['en', 'Beekeeper', 'en'],
    ['de', 'Imker/in', 'de'],
    ['fr', 'apiculteur', 'en'],
    ['it', 'apicoltore', 'en'],
  ])(
    'preserves personalization and replacements for %s',
    async (lang, greeting, linkLang) => {
      const attachments = [{ filename: 'invoice.txt', content: 'invoice' }];
      await expect(
        MailService.getInstance().sendMail({
          to: recipient,
          lang,
          subject: 'reset',
          name: 'Alex',
          key: 'reset-token',
          cc: 'billing@example.com',
          attachments,
          replacements: { amount: '55,00' },
        }),
      ).resolves.toBe(true);
      expect(mocks.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: recipient,
          subject: 'Mail title',
          text: `Beekeeper Imker/in apicoltore apiculteur reset-token ${linkLang} ${recipient} https://frontend.example/ ?server=eu 55,00 footer`.replace(
            greeting,
            'Alex',
          ),
          cc: 'billing@example.com',
          attachments,
        }),
      );
      expect(mocks.close).toHaveBeenCalledOnce();
    },
  );

  it('accepts transport results without a rejected list', async () => {
    mocks.sendMail.mockResolvedValue({ response: 'OK' });
    await expect(
      MailService.getInstance().sendMail({
        to: recipient,
        lang: 'en',
        subject: 'reset',
      }),
    ).resolves.toBe(true);
  });

  it('returns false for rejected recipients', async () => {
    mocks.sendMail.mockResolvedValue({
      response: 'Rejected',
      rejected: [recipient],
    });
    await expect(
      MailService.getInstance().sendMail({
        to: recipient,
        lang: 'en',
        subject: 'reset',
      }),
    ).resolves.toBe(false);
  });

  it.each(['test', 'ci'])(
    'preserves the early success return in %s',
    async (env) => {
      mocks.env = env;
      await expect(
        MailService.getInstance().sendMail({
          to: null,
          lang: null,
          subject: 'reset',
        }),
      ).resolves.toBe(true);
      expect(mocks.readFileSync).not.toHaveBeenCalled();
      expect(mocks.sendMail).not.toHaveBeenCalled();
    },
  );
});
