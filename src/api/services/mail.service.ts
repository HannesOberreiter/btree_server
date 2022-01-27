import * as nodemailer from 'nodemailer';
import { mailConfig } from '@config/environment.config';
import { readFileSync } from 'fs';
import p from 'path';
import { badImplementation, notFound } from '@hapi/boom';

export class MailService {
  private _transporter: nodemailer.Transporter;
  baseUrl: string;

  constructor() {
    this.baseUrl = 'https://app.btree.at';
  }

  private async setup() {
    const conf = await mailConfig;
    this._transporter = nodemailer.createTransport(conf);
  }

  private loadHtmlMail(mailName: string) {
    const mailPath = p.join(__dirname, `../../../mails/${mailName}`);
    try {
      let file = readFileSync(mailPath, 'utf-8');
      file = file.replace('%base_url%', this.baseUrl);
      return file;
    } catch (e) {
      console.error(e);
      return;
    }
  }

  async sendMail(
    to: string,
    lang: string,
    subject: string,
    key?: string,
    name?: string
  ) {
    await this.setup();
    // we only have german and english mails
    lang = lang !== 'de' ? 'en' : lang;

    let htmlMail = this.loadHtmlMail(subject + '_' + lang + '.html');

    const titleReg = /(?<=<title>)(.*?)(?=<\/title>)/gi;
    const title = titleReg.exec(htmlMail)[0];

    if (!htmlMail) {
      throw notFound('Could not find E-Mail Template.');
    }
    console.log(name);
    console.log(key);
    if (name) {
      htmlMail = htmlMail.replace('Imker/in', name);
    }
    if (key) {
      htmlMail = htmlMail.replace('%key%', key);
    }

    const options = {
      from: 'no-reply@btree.at',
      to: to,
      subject: title,
      html: htmlMail
    };

    this._transporter.sendMail(options, (error, info) => {
      if (error) {
        console.log(`error: ${error}`);
        throw badImplementation('E-Mail could not be sent.');
      }
      console.log(nodemailer.getTestMessageUrl(info));
      console.log(`Message Sent ${info.response}`);
    });
  }
}
