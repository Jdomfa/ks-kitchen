import { NextRequest, NextResponse } from 'next/server';
import { processFlowMessage, INITIAL_STATE, FlowState } from '@/lib/flows/reservationFlow';
import { sendWhatsAppMessage, sendWhatsAppButtons, markWhatsAppMessageRead } from '@/lib/whatsapp/client';
import { verifyWhatsAppSignature } from '@/lib/whatsapp/verify';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  if (!verifyWhatsAppSignature(rawBody, signature)) {
    console.error('WhatsApp webhook: invalid signature');
    return new NextResponse('Invalid signature', { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  try {
    const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ status: 'ignored' });
    }

    const from = message.from as string;
    const messageId = message.id as string;

    const text: string | undefined = message.text?.body?.trim();
    const buttonId: string | undefined =
      message.interactive?.button_reply?.id;

    const supabase = createServiceClient();

    const { error: dupeError } = await supabase
      .from('whatsapp_processed_messages')
      .insert({ message_id: messageId });

    if (dupeError) {
      return NextResponse.json({ status: 'duplicate' });
    }

    await markWhatsAppMessageRead(messageId);

    if (!text && !buttonId) {
      await sendWhatsAppMessage(from, "Sorry, I can only read text messages and menu selections right now.");
      return NextResponse.json({ status: 'ok' });
    }

    const { data: convo } = await supabase
      .from('whatsapp_conversations')
      .select('state')
      .eq('phone_number', from)
      .maybeSingle();

    const currentState: FlowState = (convo?.state as FlowState) ?? INITIAL_STATE;

    const result = await processFlowMessage({
      text: text ?? '',
      buttonId,
      state: currentState,
      channel:'whatsapp',
      customerContact: from
    });

    await supabase.from('whatsapp_conversations').upsert({
      phone_number: from,
      state: result.state,
      updated_at: new Date().toISOString(),
    });

    if (result.buttons && result.buttons.length > 0) {
      await sendWhatsAppButtons(from, result.reply, result.buttons);
    } else {
      await sendWhatsAppMessage(from, result.reply);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ status: 'error' });
  }
}