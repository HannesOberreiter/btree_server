// https://github.com/jaredhanson/passport-google-oauth2
import GoogleStrategy from 'passport-google-oauth20';
import { googleOAuth, url } from './environment.config';
import { FederatedCredential } from '@/api/models/federated_credential';
import { User } from '@/api/models/user.model';

export class PassportConfiguration {
  private static options: {
    google: GoogleStrategy.StrategyOptions;
  } = {
    google: {
      clientID: googleOAuth.clientID,
      clientSecret: googleOAuth.clientSecret,
      callbackURL: url + '/api/v1/auth/google/callback',
      scope: ['profile', 'email'],
    },
  };

  static factory(strategy: 'google'): GoogleStrategy.Strategy {
    if (strategy === 'google') {
      return new GoogleStrategy.Strategy(
        { ...this.options.google, passReqToCallback: true },
        this.verifyGoogle
      );
    }
  }

  private static verifyGoogle = (
    _req: any,
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleStrategy.Profile,
    done: GoogleStrategy.VerifyCallback
  ): void => {
    try {
      verifyUser(
        profile.id,
        profile.displayName,
        profile.provider,
        profile.emails
      ).then(
        (user) => {
          return done(null, user);
        },
        (err) => {
          console.error(err);
          return done(err, false);
        }
      );
    } catch (err) {
      console.error(err);
      return done(err, false);
    }
  };
}

type federatedUser = {
  bee_id: number | undefined;
  name: string | undefined;
  email: string | undefined;
};

async function verifyUser(
  id: string,
  name: string,
  provider: string,
  emails: {
    value: string;
    verified: 'true' | 'false';
  }[]
): Promise<federatedUser> {
  // best case federated is already in database
  const federate = await FederatedCredential.query().findOne({
    provider_id: id,
  });
  if (federate) {
    return { bee_id: federate.bee_id, name: undefined, email: undefined };
  }

  // check if federated is created by user
  for (let index = 0; index < emails.length; index++) {
    const mail = emails[index];
    const federatedTemp = await FederatedCredential.query().findOne({
      mail: mail.value,
    });
    if (federatedTemp) {
      await FederatedCredential.query()
        .patch({
          provider: provider,
          provider_id: id,
        })
        .where({ mail: mail.value });
      return {
        bee_id: federatedTemp.bee_id,
        name: undefined,
        email: undefined,
      };
    }
  }

  // check if user exists with verified mail
  let bee_id;
  let new_mail;
  for (let index = 0; index < emails.length; index++) {
    const mail = emails[index];
    if (mail.verified) {
      new_mail = mail.value;
      const user = await User.query().findOne({ email: mail.value });
      if (user) {
        bee_id = user.id;
        break;
      }
    }
  }

  // No user found with verified mail, redirect to register page on frontend with name and mail
  if (!bee_id) {
    return { bee_id: undefined, name: name, email: new_mail };
  }

  // user exists but not federated connection
  await FederatedCredential.query().insert({
    provider: provider,
    provider_id: id,
    mail: new_mail,
    bee_id: bee_id,
  });
  return { bee_id, name: undefined, email: undefined };
}
