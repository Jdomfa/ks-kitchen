import { NextRequest, NextResponse } from 'next/server';
import { processFlowMessage, INITIAL_STATE, FlowState } from '@/lib/flows/reservationFlow';
import { checkRateLimit } from '@/lib/rate-limit';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const allowed = await checkRateLimit(`website:${ip}`, 40, 300);

    if (!allowed) {
      return NextResponse.json(
        { error: "You're sending messages too quickly — please slow down and try again shortly." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const session: FlowState = body.session ?? INITIAL_STATE;

    if (!message && session.step === 'MAIN_MENU') {
      const result = await processFlowMessage({ text: '', state: INITIAL_STATE });
      return NextResponse.json({
        message: result.reply,
        session: result.state,
        buttons: result.buttons,
        inputType: result.inputType,
        summary: result.summary,
      });
    }

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const result = await processFlowMessage({ text: message, state: session });

    return NextResponse.json({
      message: result.reply,
      session: result.state,
      buttons: result.buttons,
      inputType: result.inputType,
      summary: result.summary,
    });
  } catch (error) {
    console.error('Reservation flow error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong.' },
      { status: 500 }
    );
  }
}