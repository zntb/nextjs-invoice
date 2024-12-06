import prisma from '@/app/utils/db';
import { requireUser } from '@/app/utils/hooks';
import { emailClient } from '@/app/utils/mailtrap';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ invoiceId: string }>;
  },
) {
  try {
    const session = await requireUser();

    const { invoiceId } = await params;

    const invoiceData = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        userId: session.user?.id,
      },
    });

    if (!invoiceData) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 },
      );
    }

    const sender = {
      email: 'hello@demomailtrap.com',
      name: 'Zntb',
    };

    emailClient.send({
      from: sender,
      to: [{ email: 'zenetibi@yahoo.com' }],
      template_uuid: '38ab56c6-76d3-4c0f-a2a0-bb64eb6f5999',
      template_variables: {
        first_name: invoiceData.clientName,
        company_info_name: 'InvoiceZntb',
        company_info_address: 'Chad street 124',
        company_info_city: 'Dublin',
        company_info_zip_code: '1234',
        company_info_country: 'Ireland',
      },
    });

    return NextResponse.json({ success: true });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send Email reminder' },
      { status: 500 },
    );
  }
}
