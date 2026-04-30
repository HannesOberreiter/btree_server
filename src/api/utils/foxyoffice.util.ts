import type { MailLang } from '../../services/mail.service.js';
import { Buffer } from 'node:buffer';
import {
  env,
  foxyOfficeKey,
  foxyOfficeUrl,
  serverLocation,
} from '../../config/environment.config.js';
import { Logger } from '../../services/logger.service.js';
import { MailService } from '../../services/mail.service.js';

function buildBaseUrl(endpoint: string) {
  return `https://${foxyOfficeUrl}/${endpoint}/${foxyOfficeKey}`;
}

function toISODate(date: Date) {
  return date.toISOString().split('T')[0];
}

async function getLatestInvoice() {
  const from = `${new Date().getFullYear()}-01-01`;
  const to = `${new Date().getFullYear()}-12-31`;
  const url = buildBaseUrl(`billing/api/searchInvoicesByDate/${from}/${to}`);
  const response = await fetch(url);
  const result = (await response.json()) as any;
  if (result.length > 0) {
    let newNumber = 0;
    let newNumberGroupId = 0;
    for (let i = 0; i < result.length; i++) {
      const invoice = result[i];
      if (invoice.Invoice.deleted === '1')
        continue;
      if (Number.parseInt(invoice.Invoice.number) > newNumber) {
        newNumber = Number.parseInt(invoice.Invoice.number);
        newNumberGroupId = Number.parseInt(invoice.Invoice.number_group_id);
      }
    }
    return {
      number: newNumber + 1,
      number_group_id: newNumberGroupId,
    };
  }
  // First invoice of the year: FoxyOffice assigns the group automatically
  // based on the invoice date (a new number_group_id must be configured in
  // FoxyOffice admin for the new year).
  return {
    number: 1,
    number_group_id: 0,
  };
}

function buildFullNumber(number: number): string {
  return `${new Date().getFullYear()}-${String(number).padStart(4, '0')}`;
}

/**
 * Extract the foxyoffice invoice id from the addInvoice response.
 * FoxyOffice returns JSON of the form `{"id":123}`.
 * @see https://www.foxyoffice.eu/hilfe/foxyoffice-api/
 */
function parseInvoiceId(raw: string): number | null {
  try {
    const parsed = JSON.parse(raw) as { id?: number | string };
    const id = Number(parsed?.id);
    return Number.isFinite(id) ? id : null;
  }
  catch {
    return null;
  }
}

async function downloadInvoicePdf(invoiceId: number): Promise<Buffer | null> {
  try {
    const url = `https://${foxyOfficeUrl}/billing/api/downloadInvoice/${invoiceId}/${foxyOfficeKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      Logger.getInstance().log('error', 'Could not download FoxyOffice invoice PDF', {
        label: 'FoxyOffice',
        status: response.status,
        invoiceId,
      });
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  catch (err) {
    Logger.getInstance().log('error', 'Error downloading FoxyOffice invoice PDF', {
      label: 'FoxyOffice',
      err,
    });
    return null;
  }
}

function buildInvoiceAmount(amount: number) {
  return amount.toFixed(2).replace('.', ',');
}

async function sendInvoiceToCustomer(
  mail: string,
  invoiceId: number,
  fullNumber: string,
  amount: number,
  lang: MailLang,
  mode: 'paid' | 'invoice' = 'paid',
  paymentDueDate?: string,
) {
  const pdf = await downloadInvoicePdf(invoiceId);
  if (!pdf) {
    // Fallback: notify admin so PDF can be sent manually
    MailService.getInstance().sendRawMail(
      'office@btree.at',
      `Invoice PDF download failed (${fullNumber})`,
      `Could not download invoice PDF from FoxyOffice.\nInvoiceId: ${invoiceId}\nNumber: ${fullNumber}\nCustomer: ${mail}\n`,
    );
    return;
  }

  await MailService.getInstance().sendMail({
    to: mail,
    lang,
    subject: mode === 'invoice' ? 'invoice_request' : 'invoice',
    cc: 'office@btree.at',
    replacements: {
      invoice_number: fullNumber,
      amount: buildInvoiceAmount(amount),
      payment_due: paymentDueDate ?? '',
    },
    attachments: [
      {
        filename: `invoice_${fullNumber}.pdf`,
        content: pdf,
        contentType: 'application/pdf',
      },
    ],
  });
}

export type CreateInvoicePaymentType = 'PayPal' | 'Stripe' | 'Mollie' | 'Invoice';

export interface CreateInvoiceOptions {
  /**
   * `paid` (default): payment already settled via the given provider.
   * `invoice`: open invoice with 7-day payment target (bank transfer).
   */
  mode?: 'paid' | 'invoice'
  /** Payment target in days (only used for mode=invoice). Default 7. */
  paymentTargetDays?: number
}

export async function createInvoice(
  mail: string,
  price: number,
  amount: number,
  type: CreateInvoicePaymentType,
  lang: MailLang = 'en',
  options: CreateInvoiceOptions = {},
) {
  const mode = options.mode ?? 'paid';
  const paymentTargetDays = options.paymentTargetDays ?? 7;
  try {
    const latestInvoice = await getLatestInvoice();

    const today = new Date();
    const paymentTargetDate = new Date(today);
    if (mode === 'invoice') {
      paymentTargetDate.setDate(today.getDate() + paymentTargetDays);
    }

    const info
      = mode === 'invoice'
        ? `Lieferdatum: wie Rechnungsdatum\n\nBitte überweisen Sie den Betrag bis spätestens <b>${toISODate(paymentTargetDate)}</b> auf folgendes Konto:\n\n<b>Unsere Bankverbindung:</b>\nSteiermärkische Sparkasse\nIBAN: AT05 2081 5000 4507 3715\nBIC: STSPAT2GXXX\n\nVerwendungszweck: <b>Rechnung ${buildFullNumber(latestInvoice.number)}</b>\n\nVielen Dank für Ihre Unterstützung und ein erfolgreiches Imkerjahr!\n\nMit freundlichen Grüßen\nHannes Oberreiter\n<b>btree.at</b>`
        : `Lieferdatum:  wie Rechnungsdatum\n\nBetrag wurde bereits mit <b>${type}</b> bezahlt!\n\nVielen Dank für Ihre Unterstützung und ein erfolgreiches Imkerjahr!\n\nMit freundlichen Grüßen\nHannes Oberreiter\n<b>btree.at</b>`;

    const data = {
      Invoice: {
        number: latestInvoice.number,
        number_group_id:
          latestInvoice.number_group_id === 0
            ? null
            : latestInvoice.number_group_id,
        address: mail,
        date: toISODate(today),
        paid: mode === 'invoice' ? 0 : 1,
        canceled: 0,
        paymentTarget: toISODate(paymentTargetDate),
        leading_text:
          'Sehr geehrte Damen und Herren,\n\nwir erlauben uns folgende Rechnung auszustellen:',
        info,
      },
      InvoicePosition: [
        {
          text: 'b.tree PREMIUM Mitglied, Abo Time: + 1 Jahr Abo',
          amount,
          unit: 'x',
          price: price / amount / 1.2,
          tax_percent: 20,
          discount: 0,
        },
      ],
    };

    const form = new FormData();

    for (const key in data.Invoice) {
      const value = data.Invoice[key as keyof typeof data.Invoice];
      form.append(`Invoice[${key}]`, value === null ? '' : String(value));
    }

    for (let i = 0; i < data.InvoicePosition.length; i++) {
      const position = data.InvoicePosition[i];
      for (const key in position) {
        const value = position[key as keyof typeof position];
        form.append(
          `InvoicePosition[${i}][${key}]`,
          value === null ? '' : String(value),
        );
      }
    }

    if (env === 'production') {
      const response = await fetch(buildBaseUrl('billing/api/addInvoice'), {
        method: 'POST',
        body: form,
      });

      const result = await response.text();
      if (response.status === 200) {
        MailService.getInstance().sendRawMail(
          'office@btree.at',
          'New invoice created',
          `FoxyOfficeResponse: ${
            result
          }\n\n`
          + `InvoiceNumber: ${
            JSON.stringify(latestInvoice)
          }\n\n`
          + `CustomerMail: ${
            JSON.stringify(mail)
          }\n\n`
          + `Server: ${
            serverLocation}`,
        );

        const invoiceId = parseInvoiceId(result);
        if (invoiceId) {
          const fullNumber = buildFullNumber(latestInvoice.number);
          await sendInvoiceToCustomer(
            mail,
            invoiceId,
            fullNumber,
            price,
            lang,
            mode,
            mode === 'invoice' ? toISODate(paymentTargetDate) : undefined,
          );
        }
        else {
          MailService.getInstance().sendRawMail(
            'office@btree.at',
            `Invoice PDF not sent (${latestInvoice.number})`,
            `Could not parse invoice id from FoxyOffice response.\nResponse: ${result}\nCustomer: ${mail}\n`,
          );
        }
      }
    }
    else {
      Logger.getInstance().log('info', 'FoxyOffice Invoice Data', {
        label: 'FoxyOffice',
        data,
        lang,
      });
      // In dev we skip the real FoxyOffice call (no invoice id, no PDF),
      // but still deliver the cover mail so the nodemailer preview URL shows
      // up in the logs.
      const fullNumber = buildFullNumber(latestInvoice.number);
      await MailService.getInstance().sendMail({
        to: mail,
        lang,
        subject: mode === 'invoice' ? 'invoice_request' : 'invoice',
        cc: 'office@btree.at',
        replacements: {
          invoice_number: fullNumber,
          amount: buildInvoiceAmount(price),
          payment_due:
            mode === 'invoice' ? toISODate(paymentTargetDate) : '',
        },
      });
    }
  }
  catch (err) {
    Logger.getInstance().log('error', 'Error creating invoice', {
      label: 'FoxyOffice',
      err,
    });
  }
}
