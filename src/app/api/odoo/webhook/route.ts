import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.ODOO_STAFF_REPLY_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const phone = body.x_studio_whatsapp_number;
  const message = body.x_studio_reply_to_customer_1;

  if (!phone || !message) {
    return NextResponse.json({ error: 'Missing phone or message' }, { status: 400 });
  }

  try {
    await sendWhatsAppMessage(phone, message);
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Failed to relay Odoo staff reply to WhatsApp:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}