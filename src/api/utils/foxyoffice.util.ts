import {
  foxyOfficeKey,
  foxyOfficeUrl,
} from '../../config/environment.config.js';
import { MailService } from '../../services/mail.service.js';
import { Logger } from '../../services/logger.service.js';

function buildBaseUrl(endpoint: string) {
  return `https://${foxyOfficeUrl}/${endpoint}/${foxyOfficeKey}`;
}

function DateToFormat(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
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
      if (invoice['Invoice'].deleted == '1') continue;
      if (parseInt(invoice['Invoice'].number) > newNumber) {
        newNumber = parseInt(invoice['Invoice'].number);
        newNumberGroupId = parseInt(invoice['Invoice'].number_group_id);
      }
    }
    return {
      number: newNumber + 1,
      number_group_id: newNumberGroupId,
    };
  }
  return {
    number: Math.random().toString(36).slice(2, 9),
    number_group_id: 0,
  };
}

export async function createInvoice(
  mail: string,
  price: number,
  amount: number,
  type: 'PayPal' | 'Stripe',
) {
  try {
    const latestInvoice = await getLatestInvoice();

    const data = {
      Invoice: {
        number: latestInvoice.number,
        number_group_id:
          latestInvoice.number_group_id === 0
            ? null
            : latestInvoice.number_group_id,
        address: mail,
        date: DateToFormat(new Date()),
        paid: 0,
        canceled: 0,
        paymentTarget: DateToFormat(new Date()),
        leading_text:
          'Sehr geehrte Damen und Herren,\n\nwir erlauben uns folgende Rechnung auszustellen:',
        info: `Lieferdatum:  wie Rechnungsdatum\n\nBetrag wurde bereits mit <b>${type}</b> bezahlt!\n\nVielen Dank für Ihre Unterstützung und ein erfolgreiches Imkerjahr!\n\nMit freundlichen Grüßen\nHannes Oberreiter\n<b>btree.at</b>`,
      },
      InvoicePosition: [
        {
          text: 'b.tree PREMIUM Mitglied, Abo Time: + 1 Jahr Abo',
          amount: amount,
          unit: 'x',
          price: price / amount / 1.2,
          tax_percent: 20,
          discount: 0,
        },
      ],
    };

    const form = new FormData();

    for (let key in data.Invoice) {
      form.append(`Invoice[${key}]`, data.Invoice[key]);
    }

    for (let i = 0; i < data.InvoicePosition.length; i++) {
      for (let key in data.InvoicePosition[i]) {
        form.append(
          `InvoicePosition[${i}][${key}]`,
          data.InvoicePosition[i][key],
        );
      }
    }

    const response = await fetch(buildBaseUrl('billing/api/addInvoice'), {
      method: 'POST',
      body: form,
    });

    const result = await response.text();

    if (response.status === 200) {
      MailService.getInstance().sendRawMail(
        'office@btree.at',
        'New invoice created',
        result +
          '\n\n' +
          JSON.stringify(latestInvoice) +
          '\n\n' +
          JSON.stringify(mail),
      );
    }
  } catch (err) {
    Logger.getInstance().log('error', 'Error creating invoice', {
      label: 'FoxyOffice',
      err: err,
    });
  }
}
