import type { Kysely } from 'kysely';

import { MailService } from '../../services/mail.service.js';
import type { MailLang } from '../../services/mail.service.js';
import { MailLangs } from '../../services/mail.service.js';
import type { DB } from '../../types/db.types.js';
import { ingestScaleReading } from '../modules/scale_data.module.js';
import type {
  ExternalScaleParams,
  ExternalScaleQuery,
} from '../schemas/external.schema.js';

function mailLanguage(value: string | null): MailLang {
  return MailLangs.includes(value as MailLang) ? (value as MailLang) : 'en';
}

export async function ingestExternalScaleReading(
  db: Kysely<DB>,
  params: ExternalScaleParams,
  input: ExternalScaleQuery,
) {
  const { result, warning } = await ingestScaleReading(db, params, input);

  if (warning) {
    await Promise.allSettled(
      warning.recipients
        .filter((recipient) => recipient.email)
        .map((recipient) =>
          MailService.getInstance().sendMail({
            to: recipient.email!,
            lang: mailLanguage(recipient.lang),
            subject: 'weight_warning',
            key: `${warning.scaleName}: ${warning.difference} (${warning.previousWeight} - ${warning.currentWeight})`,
            name: recipient.username ?? undefined,
          }),
        ),
    );
  }

  return result;
}
