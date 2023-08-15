import * as nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import p from 'path';
import httpErrors from 'http-errors';

import { env, frontend, mailConfig } from '../config/environment.config.js';
import { ENVIRONMENT } from '../config/constants.config.js';
import { Logger } from './logger.service.js';

interface customMail {
  to: string;
  lang: string;
  subject: string;
  key?: string;
  name?: string;
}

export class MailService {
  private _transporter: nodemailer.Transporter;
  baseUrl = frontend;
  private logger = Logger.getInstance();

  constructor() {}

  async setup() {
    if (env === ENVIRONMENT.development || env === ENVIRONMENT.test) {
      try {
        const account = await nodemailer.createTestAccount();
        mailConfig.secure = false;
        mailConfig.auth.user = account.user;
        mailConfig.auth.pass = account.pass;
      } catch (e) {
        console.error(e);
      }
    }
    this.logger.log('debug', `Setup mail with host: ${mailConfig.host}`, {});
    this._transporter = nodemailer.createTransport(mailConfig);
  }

  private loadHtmlMail(mailName: string) {
    const mailPath = p.join(__dirname, `../../mails/${mailName}.txt`);
    try {
      return readFileSync(mailPath, 'utf-8');
    } catch (e) {
      this.logger.log('error', `Could not find E-Mail Template.`, {
        name: mailName,
        error: e,
      });
      return;
    }
  }

  private loadFooter(lang: string) {
    const mailPath = p.join(
      __dirname,
      `../../mails/partials/footer_${lang}.txt`,
    );
    try {
      return readFileSync(mailPath, 'utf-8');
    } catch (e) {
      this.logger.log('error', `Could not find E-Mail Template.`, {
        lang,
        error: e,
      });
      return;
    }
  }

  async sendMail({
    to,
    lang,
    subject,
    key = 'false',
    name = 'false',
  }: customMail) {
    if (env === ENVIRONMENT.test || env === ENVIRONMENT.ci) return true;

    // Only use languages which are available (translated), fallback english
    lang = ['de', 'fr', 'it'].includes(lang) ? lang : 'en';

    let htmlMail = this.loadHtmlMail(subject + '_' + lang);
    if (!htmlMail) {
      throw httpErrors.NotFound('Could not find E-Mail Template.');
    }
    let htmlFooter = this.loadFooter(lang);
    if (!htmlFooter) {
      throw httpErrors.NotFound('Could not find E-Mail Template.');
    }
    htmlMail = htmlMail + htmlFooter;

    /*
      Fake <title></title> attribute to set email header
    */
    const titleReg = /(?<=<title>)(.*?)(?=<\/title>)/gi;
    const title = titleReg.exec(htmlMail)[0];
    htmlMail = htmlMail.replace(/(<title>)(.*?)(<\/title>)/g, '');

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
      htmlMail = htmlMail.replace(/%key%/g, key);
    }
    // Main page and docuemntation is only available in german and english
    if (['fr', 'it'].includes(lang)) {
      htmlMail = htmlMail.replace(/%lang%/g, 'en');
    } else {
      htmlMail = htmlMail.replace(/%lang%/g, lang);
    }
    htmlMail = htmlMail.replace(/%mail%/g, to);
    htmlMail = htmlMail.replace(/%base_url%/g, this.baseUrl + '/');

    const options = {
      from: {
        name: 'b.tree - Beekeeping Database',
        address: 'no-reply@btree.at',
      },
      to: to,
      subject: title,
      text: htmlMail,
    };

    try {
      const result = await this._transporter.sendMail(options);
      this._transporter.close();
      if (result.rejected.length > 0) {
        this.logger.log('error', `Could not send E-Mail.`, result);
        throw httpErrors.InternalServerError('E-Mail could not be sent.');
      }
      if (env === ENVIRONMENT.development) {
        const testUrl = nodemailer.getTestMessageUrl(result) as string;
        this.logger.log('info', `Preview Url: ${testUrl}`, {});
      }
      this.logger.log('info', `Message Sent ${result.response}`, {
        subject: title,
        result: result,
      });
      return true;
    } catch (e) {
      this.logger.log('error', `Could not send E-Mail.`, { error: e });
      return false;
    }
  }

  async sendRawMail(to: string, subject: string, text: string) {
    const options = {
      from: {
        name: 'b.tree - Beekeeping Database',
        address: 'no-reply@btree.at',
      },
      to: to,
      subject: subject,
      text: text,
    };

    try {
      await this._transporter.sendMail(options, (error, info) => {
        this._transporter.close();
        if (error) {
          console.error(`error: ${error}`);
          throw httpErrors.InternalServerError('E-Mail could not be sent.');
        }
        if (env === ENVIRONMENT.development || env === ENVIRONMENT.test) {
          const testUrl = nodemailer.getTestMessageUrl(info) as string;
          this.logger.log('info', `Preview Url: ${testUrl}`, {});
        }
        this.logger.log('info', `Message Sent ${info.response}`, {});
      });
    } catch (e) {
      this.logger.log('error', `Could not send E-Mail.`, { error: e });
    }
  }
}
