import * as nodemailer from 'nodemailer';
import { env, frontend, mailConfig } from '@config/environment.config';
import { readFileSync } from 'fs';
import p from 'path';
import { badImplementation, notFound } from '@hapi/boom';
import { ENVIRONMENT } from '../types/constants/environment.const';
interface customMail {
  to: string;
  lang: string;
  subject: string;
  key?: string;
  name?: string;
}

export class MailService {
  private _transporter: nodemailer.Transporter;
  baseUrl: string;

  constructor() {
    this.baseUrl = frontend;
  }

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
    const conf = mailConfig;
    this._transporter = nodemailer.createTransport(conf);
  }

  private loadHtmlMail(mailName: string) {
    const mailPath = p.join(__dirname, `../../../mails/${mailName}.txt`);
    try {
      return readFileSync(mailPath, 'utf-8');
    } catch (e) {
      console.error(e);
      return;
    }
  }

  private loadFooter(lang: string) {
    const mailPath = p.join(
      __dirname,
      `../../../mails/partials/footer_${lang}.txt`,
    );
    try {
      return readFileSync(mailPath, 'utf-8');
    } catch (e) {
      console.error(e);
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
    if (env === ENVIRONMENT.test || env === ENVIRONMENT.ci) return;

    // Only use languages which are available (translated), fallback english
    lang = ['de', 'fr', 'it'].includes(lang) ? lang : 'en';

    let htmlMail = this.loadHtmlMail(subject + '_' + lang);
    if (!htmlMail) {
      throw notFound('Could not find E-Mail Template.');
    }
    let htmlFooter = this.loadFooter(lang);
    if (!htmlFooter) {
      throw notFound('Could not find E-Mail Template.');
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
      await this._transporter.sendMail(options, (error, info) => {
        this._transporter.close();
        if (error) {
          console.error(`error: ${error}`);
          throw badImplementation('E-Mail could not be sent.');
        }
        if (env === ENVIRONMENT.development || env === ENVIRONMENT.test) {
          console.log(nodemailer.getTestMessageUrl(info));
        }
        console.log(`Message Sent ${info.response}`);
      });
    } catch (e) {
      console.error(e);
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
          throw badImplementation('E-Mail could not be sent.');
        }
        if (env === ENVIRONMENT.development || env === ENVIRONMENT.test) {
          console.log(nodemailer.getTestMessageUrl(info));
        }
        console.log(`Message Sent ${info.response}`);
      });
    } catch (e) {
      console.error(e);
    }
  }
}
