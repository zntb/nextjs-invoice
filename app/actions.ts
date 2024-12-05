'use server';

import { requireUser } from './utils/hooks';
import prisma from './utils/db';
import { redirect } from 'next/navigation';
import { parseWithZod } from '@conform-to/zod';
import { onboardingSchema } from './utils/zodSchemas';
import { invoiceSchema } from './utils/zodSchemas';
import { formatCurrency } from './utils/formatCurrency';
import { emailClient } from './utils/mailtrap';

export async function onboardUser(prevState: unknown, formData: FormData) {
  const session = await requireUser();

  const submission = parseWithZod(formData, {
    schema: onboardingSchema,
  });

  if (submission.status !== 'success') {
    return submission.reply();
  }

  await prisma.user.update({
    where: {
      id: session.user?.id,
    },
    data: {
      firstName: submission.value.firstName,
      lastName: submission.value.lastName,
      address: submission.value.address,
    },
  });

  return redirect('/dashboard');
}

export async function createInvoice(prevState: unknown, formData: FormData) {
  const session = await requireUser();

  const submission = parseWithZod(formData, {
    schema: invoiceSchema,
  });

  if (submission.status !== 'success') {
    return submission.reply();
  }

  const data = await prisma.invoice.create({
    data: {
      clientAddress: submission.value.clientAddress,
      clientEmail: submission.value.clientEmail,
      clientName: submission.value.clientName,
      currency: submission.value.currency,
      date: submission.value.date,
      dueDate: submission.value.dueDate,
      fromAddress: submission.value.fromAddress,
      fromEmail: submission.value.fromEmail,
      fromName: submission.value.fromName,
      invoiceItemDescription: submission.value.invoiceItemDescription,
      invoiceItemQuantity: submission.value.invoiceItemQuantity,
      invoiceItemRate: submission.value.invoiceItemRate,
      invoiceName: submission.value.invoiceName,
      invoiceNumber: submission.value.invoiceNumber,
      status: submission.value.status,
      total: submission.value.total,
      note: submission.value.note,
      userId: session.user?.id,
    },
  });

  const sender = {
    email: 'hello@demomailtrap.com',
    name: 'Zntb',
  };

  emailClient.send({
    from: sender,
    to: [{ email: 'zenetibi@yahoo.com' }],
    template_uuid: 'e3e57102-6c1d-4832-af3a-e88bb59b1c47',
    template_variables: {
      clientName: submission.value.clientName,
      invoiceNumber: submission.value.invoiceNumber,
      invoiceDueDate: new Intl.DateTimeFormat('en-US', {
        dateStyle: 'long',
      }).format(new Date(submission.value.date)),
      invoiceAmount: formatCurrency({
        amount: submission.value.total,
        currency: submission.value.currency as 'USD' | 'EUR',
      }),
      invoiceLink:
        process.env.NODE_ENV !== 'production'
          ? `http://localhost:3000/api/invoice/${data.id}`
          : `https://invoice-marshal.vercel.app/api/invoice/${data.id}`,
    },
  });

  return redirect('/dashboard/invoices');
}
