import { checkMySQLError } from '@utils/error.util';
import {
  dropboxClientId,
  dropboxClientSecret,
  frontend,
} from '@/config/environment.config';
import { Dropbox as DropboxModel } from '../models/dropbox.model';
import { Dropbox, DropboxAuth } from 'dropbox';
import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Dropbox Apps: https://www.dropbox.com/developers/apps?_tk=pilot_lp&_ad=topbar4&_camp=myapps
 */
export default class DropboxController {
  private static config = {
    clientId: dropboxClientId,
    clientSecret: dropboxClientSecret,
  };
  private static redirect = `${frontend}/setting/dropbox`; // must be exactly the same as in the Dropbox App defined

  static async get(_req: FastifyRequest, reply: FastifyReply) {
    try {
      const dbx = new DropboxAuth(DropboxController.config);
      dbx
        .getAuthenticationUrl(
          DropboxController.redirect,
          null,
          'code',
          'offline',
          null,
          'none',
          false,
        )
        .then((authUrl) => {
          return { url: authUrl };
        });
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async auth(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { code } = req.params as any;
      const dbx = new DropboxAuth(DropboxController.config);
      const token = await dbx.getAccessTokenFromCode(
        DropboxController.redirect,
        code,
      );

      const refresh_token = token.result['refresh_token'];
      const access_token = token.result['access_token'];

      await DropboxModel.transaction(async (trx) => {
        const exist = await DropboxModel.query(trx)
          .select('id')
          .findOne('user_id', req.session.user.user_id);
        if (exist) {
          return await DropboxModel.query(trx).findById(exist.id).patch({
            refresh_token: refresh_token,
            access_token: access_token,
          });
        } else {
          return await DropboxModel.query(trx).insert({
            refresh_token: refresh_token,
            access_token: access_token,
            user_id: req.session.user.user_id,
          });
        }
      });
      reply.redirect(access_token);
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async token(req: FastifyRequest, reply: FastifyReply) {
    try {
      const token = await DropboxModel.query().findOne(
        'user_id',
        req.session.user.user_id,
      );
      if (!token) {
        return '';
      }
      // check if access_token is still valid, to prevent one round trip
      const dbx = new DropboxAuth({
        ...DropboxController.config,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
      });
      await dbx.checkAndRefreshAccessToken();
      if (token.access_token !== dbx.getAccessToken()) {
        await DropboxModel.transaction(async (trx) => {
          return DropboxModel.query(trx)
            .patch({
              access_token: dbx.getAccessToken(),
              refresh_token: dbx.getRefreshToken(),
            })
            .findOne('user_id', req.session.user.user_id);
        });
      }
      return token.access_token;
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async delete(req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await DropboxModel.transaction(async (trx) => {
        const token = await DropboxModel.query(trx)
          .select('refresh_token')
          .findOne('user_id', req.session.user.user_id);
        const dbx = new Dropbox({
          ...DropboxController.config,
          refreshToken: token.refresh_token,
        });
        await dbx.authTokenRevoke();
        return DropboxModel.query(trx)
          .delete()
          .where('user_id', req.session.user.user_id);
      });
      return result;
    } catch (e) {
      throw checkMySQLError(e);
    }
  }
}
