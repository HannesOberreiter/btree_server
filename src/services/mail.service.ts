import type { Buffer } from 'node:buffer';
import type { SendMailOptions, Transporter } from 'nodemailer';
import { readFileSync } from 'node:fs';
import httpErrors from 'http-errors';
import { createTestAccount, createTransport, getTestMessageUrl } from 'nodemailer';

import { ENVIRONMENT } from '../config/constants.config.js';
import {
  env,
  frontend,
  mailConfig,
  rootDirectory,
  serverLocation,
} from '../config/environment.config.js';
import { Logger } from './logger.service.js';

export const MailLangs = ['de', 'en', 'fr', 'it'] as const;
export type MailLang = typeof MailLangs[number];

const TITLE_TAG_REGEX = /(?<=<title>).*?(?=<\/title>)/i;
const TITLE_FULL_REGEX = /<title>.*?<\/title>/g;
const KEY_PLACEHOLDER_REGEX = /%key%/g;
const LANG_PLACEHOLDER_REGEX = /%lang%/g;
const MAIL_PLACEHOLDER_REGEX = /%mail%/g;
const BASE_URL_PLACEHOLDER_REGEX = /%base_url%/g;
const PARAMS_PLACEHOLDER_REGEX = /%params%/g;

interface customMail {
  to: string
  lang: string
  subject: string
  key?: string
  name?: string
  cc?: string | string[]
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
  /**
   * Extra template placeholders to replace, keyed by placeholder name
   * without the surrounding `%`. E.g. `{ amount: '55,00' }` replaces `%amount%`.
   */
  replacements?: Record<string, string>
}

export class MailService {
  private _transporter!: Transporter;
  private static instance: MailService;
  params = serverLocation === 'eu' ? '?server=eu' : '?server=us';

  baseUrl = frontend;
  private logger = Logger.getInstance();

  static getInstance(): MailService {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  private constructor() {}

  async setup() {
    if (env === ENVIRONMENT.development || env === ENVIRONMENT.test) {
      try {
        const account = await createTestAccount();
        mailConfig.secure = false;
        mailConfig.auth.user = account.user;
        mailConfig.auth.pass = account.pass;
      }
      catch (e) {
        console.error(e);
      }
    }
    this.logger.log('debug', `Setup mail with host: ${mailConfig.host}`, {});
    this._transporter = createTransport(mailConfig);
  }

  private loadHtmlMail(mailName: string) {
    const mailPath = `${rootDirectory}/mails/${mailName}.txt`;
    try {
      return readFileSync(mailPath, 'utf-8');
    }
    catch (e) {
      this.logger.log('error', `Could not find E-Mail Template.`, {
        name: mailName,
        error: e,
      });
    }
  }

  private loadFooter(lang: string) {
    const mailPath = `${rootDirectory}/mails/partials/footer_${lang}.txt`;
    try {
      return readFileSync(mailPath, 'utf-8');
    }
    catch (e) {
      this.logger.log('error', `Could not find E-Mail Template.`, {
        lang,
        error: e,
      });
    }
  }

  async sendMail({
    to,
    lang,
    subject,
    key = 'false',
    name = 'false',
    cc,
    attachments,
    replacements,
  }: customMail) {
    if (env === ENVIRONMENT.test || env === ENVIRONMENT.ci)
      return true;

    // Only use languages which are available (translated), fallback english
    if (!(MailLangs as readonly string[]).includes(lang))
      lang = 'en';

    let htmlMail = this.loadHtmlMail(`${subject}_${lang}`);
    if (!htmlMail) {
      throw httpErrors.NotFound('Could not find E-Mail Template.');
    }
    const htmlFooter = this.loadFooter(lang);
    if (!htmlFooter) {
      throw httpErrors.NotFound('Could not find E-Mail Template.');
    }
    htmlMail = (htmlMail + htmlFooter);

    if (name !== 'false' && name) {
      switch (lang) {
        case 'en': {
          htmlMail = htmlMail.replace('Beekeeper', name);
          break;
        }
        case 'de': {
          htmlMail = htmlMail.replace('Imker/in', name);
          break;
        }
        case 'it': {
          htmlMail = htmlMail.replace('apicoltore', name);
          break;
        }
        case 'fr': {
          htmlMail = htmlMail.replace('apiculteur', name);
          break;
        }
      }
    }

    if (key !== 'false') {
      htmlMail = htmlMail.replace(KEY_PLACEHOLDER_REGEX, key);
    }
    // Main page and documentation is only available in german and english
    if (['fr', 'it'].includes(lang)) {
      htmlMail = htmlMail.replace(LANG_PLACEHOLDER_REGEX, 'en');
    }
    else {
      htmlMail = htmlMail.replace(LANG_PLACEHOLDER_REGEX, lang);
    }
    htmlMail = htmlMail.replace(MAIL_PLACEHOLDER_REGEX, to);
    htmlMail = htmlMail.replace(BASE_URL_PLACEHOLDER_REGEX, `${this.baseUrl}/`);
    htmlMail = htmlMail.replace(PARAMS_PLACEHOLDER_REGEX, this.params);

    if (replacements) {
      for (const [k, v] of Object.entries(replacements)) {
        htmlMail = htmlMail.replaceAll(`%${k}%`, v);
      }
    }

    /** @description Fake <title></title> attribute to set email header */
    const titleReg = TITLE_TAG_REGEX;
    const title = titleReg.exec(htmlMail)![0];
    htmlMail = htmlMail.replace(TITLE_FULL_REGEX, '');

    const options: SendMailOptions = {
      from: {
        name: 'b.tree - Beekeeping Database',
        address: 'no-reply@btree.at',
      },
      to,
      subject: title,
      text: htmlMail,
      ...(cc ? { cc } : {}),
      ...(attachments ? { attachments } : {}),
    };

    try {
      const result = await this._transporter.sendMail(options);
      this._transporter.close();
      if (result.rejected.length > 0) {
        this.logger.log('error', `Could not send E-Mail.`, result);
        throw new httpErrors.InternalServerError('E-Mail could not be sent.');
      }
      if (env === ENVIRONMENT.development) {
        const testUrl = getTestMessageUrl(result) as string;
        this.logger.log('info', `Preview Url: ${testUrl}`, {});
      }
      this.logger.log('info', `Message Sent ${result.response}`, {
        subject: title,
      });
      return true;
    }
    catch (e) {
      this.logger.log('error', `Could not send E-Mail: ${e instanceof Error ? e.message : String(e)}`, {});
      return false;
    }
  }

  async sendRawMail(
    to: string,
    subject: string,
    text: string,
    extra?: {
      cc?: string | string[]
      attachments?: Array<{
        filename: string
        content: Buffer | string
        contentType?: string
      }>
    },
  ) {
    const options: SendMailOptions = {
      from: {
        name: 'b.tree - Beekeeping Database',
        address: 'no-reply@btree.at',
      },
      to,
      subject,
      text,
      ...(extra?.cc ? { cc: extra.cc } : {}),
      ...(extra?.attachments ? { attachments: extra.attachments } : {}),
    };

    try {
      this._transporter.sendMail(options, (error, info) => {
        this._transporter.close();
        if (error) {
          console.error(`error: ${error}`);
          throw new httpErrors.InternalServerError('E-Mail could not be sent.');
        }
        if (env === ENVIRONMENT.development || env === ENVIRONMENT.test) {
          const testUrl = getTestMessageUrl(info) as string;
          this.logger.log('info', `Preview Url: ${testUrl}`, {});
        }
        this.logger.log('info', `Message Sent ${info.response}`, {});
      });
    }
    catch (e) {
      this.logger.log('error', `Could not send E-Mail: ${e instanceof Error ? e.message : String(e)}`, {});
    }
  }
}
