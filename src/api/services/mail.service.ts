import * as nodemailer from 'nodemailer';
import { env, frontend, mailConfig } from '@config/environment.config';
import { readFileSync } from 'fs';
import p from 'path';
import { badImplementation, notFound } from '@hapi/boom';
interface customMail {
  to: string;
  lang: string;
  subject: string;
  key?: string;
  name?: string;
  email?: string;
}

export class MailService {
  private _transporter: nodemailer.Transporter;
  baseUrl: string;

  constructor() {
    this.baseUrl = frontend;
  }

  private async setup() {
    const conf = mailConfig;
    if (env !== 'production') {
      await nodemailer.createTestAccount((_err, account) => {
        mailConfig.secure = false;
        mailConfig.auth.user = account.user;
        mailConfig.auth.pass = account.pass;
      });
    }
    this._transporter = nodemailer.createTransport(conf);
  }

  private loadHtmlMail(mailName: string) {
    const mailPath = p.join(__dirname, `../../../mails/${mailName}`);
    try {
      let file = readFileSync(mailPath, 'utf-8');
      file = file.replace(/%base_url%/g, this.baseUrl);
      return file;
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
    email = 'false',
  }: customMail) {
    if (env === 'test') return;

    await this.setup();
    // we only have german and english mails
    lang = lang !== 'de' ? 'en' : lang;

    let htmlMail = this.loadHtmlMail(subject + '_' + lang + '.html');

    const titleReg = /(?<=<title>)(.*?)(?=<\/title>)/gi;
    const title = titleReg.exec(htmlMail)[0];

    if (!htmlMail) {
      throw notFound('Could not find E-Mail Template.');
    }

    if (name !== 'false') {
      switch (lang) {
        case 'en': {
          htmlMail.replace('Beekeeper', name);
          break;
        }
        case 'de': {
          htmlMail.replace('Imker/in', name);
          break;
        }
      }
    }
    if (email !== 'false') {
      htmlMail = htmlMail.replace(/%mail%/g, email);
    }
    if (key !== 'false') {
      htmlMail = htmlMail.replace(/%key%/g, key);
    }

    const options = {
      from: 'no-reply@btree.at',
      to: to,
      subject: title,
      html: htmlMail,
    };

    this._transporter.sendMail(options, (error, info) => {
      this._transporter.close();
      if (error) {
        console.log(`error: ${error}`);
        throw badImplementation('E-Mail could not be sent.');
      }
      if (env !== 'production') {
        console.log(nodemailer.getTestMessageUrl(info));
      }
      console.log(`Message Sent ${info.response}`);
    });
  }
}
