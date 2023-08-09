"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const nodemailer = __importStar(require("nodemailer"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const http_errors_1 = __importDefault(require("http-errors"));
const environment_config_js_1 = require("../config/environment.config.js");
const constants_config_js_1 = require("../config/constants.config.js");
const logger_service_js_1 = require("./logger.service.js");
class MailService {
    _transporter;
    baseUrl;
    logger = logger_service_js_1.Logger.getInstance();
    constructor() {
        this.baseUrl = environment_config_js_1.frontend;
    }
    async setup() {
        if (environment_config_js_1.env === constants_config_js_1.ENVIRONMENT.development || environment_config_js_1.env === constants_config_js_1.ENVIRONMENT.test) {
            try {
                const account = await nodemailer.createTestAccount();
                environment_config_js_1.mailConfig.secure = false;
                environment_config_js_1.mailConfig.auth.user = account.user;
                environment_config_js_1.mailConfig.auth.pass = account.pass;
            }
            catch (e) {
                console.error(e);
            }
        }
        const conf = environment_config_js_1.mailConfig;
        this._transporter = nodemailer.createTransport(conf);
    }
    loadHtmlMail(mailName) {
        const mailPath = path_1.default.join(__dirname, `../../../mails/${mailName}.txt`);
        try {
            return (0, fs_1.readFileSync)(mailPath, 'utf-8');
        }
        catch (e) {
            this.logger.log('error', `Could not find E-Mail Template.`, {
                name: mailName,
                error: e,
            });
            return;
        }
    }
    loadFooter(lang) {
        const mailPath = path_1.default.join(__dirname, `../../../mails/partials/footer_${lang}.txt`);
        try {
            return (0, fs_1.readFileSync)(mailPath, 'utf-8');
        }
        catch (e) {
            this.logger.log('error', `Could not find E-Mail Template.`, {
                lang,
                error: e,
            });
            return;
        }
    }
    async sendMail({ to, lang, subject, key = 'false', name = 'false', }) {
        if (environment_config_js_1.env === constants_config_js_1.ENVIRONMENT.test || environment_config_js_1.env === constants_config_js_1.ENVIRONMENT.ci)
            return;
        // Only use languages which are available (translated), fallback english
        lang = ['de', 'fr', 'it'].includes(lang) ? lang : 'en';
        let htmlMail = this.loadHtmlMail(subject + '_' + lang);
        if (!htmlMail) {
            throw http_errors_1.default.NotFound('Could not find E-Mail Template.');
        }
        let htmlFooter = this.loadFooter(lang);
        if (!htmlFooter) {
            throw http_errors_1.default.NotFound('Could not find E-Mail Template.');
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
        }
        else {
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
                    throw http_errors_1.default.InternalServerError('E-Mail could not be sent.');
                }
                if (environment_config_js_1.env === constants_config_js_1.ENVIRONMENT.development || environment_config_js_1.env === constants_config_js_1.ENVIRONMENT.test) {
                    const testUrl = nodemailer.getTestMessageUrl(info);
                    this.logger.log('info', `Preview Url: ${testUrl}`, {});
                }
                this.logger.log('info', `Message Sent ${info.response}`, {
                    subject: title,
                });
            });
        }
        catch (e) {
            this.logger.log('error', `Could not send E-Mail.`, { error: e });
        }
    }
    async sendRawMail(to, subject, text) {
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
                    throw http_errors_1.default.InternalServerError('E-Mail could not be sent.');
                }
                if (environment_config_js_1.env === constants_config_js_1.ENVIRONMENT.development || environment_config_js_1.env === constants_config_js_1.ENVIRONMENT.test) {
                    const testUrl = nodemailer.getTestMessageUrl(info);
                    this.logger.log('info', `Preview Url: ${testUrl}`, {});
                }
                this.logger.log('info', `Message Sent ${info.response}`, {});
            });
        }
        catch (e) {
            this.logger.log('error', `Could not send E-Mail.`, { error: e });
        }
    }
}
exports.MailService = MailService;
