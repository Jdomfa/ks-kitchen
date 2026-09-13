import { NextRequest, NextResponse } from 'next/server';
import { processFlowMessage, INITIAL_STATE, FlowState } from '@/lib/flows/reservationFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const session: FlowState = body.session ?? INITIAL_STATE;

    if (!message && session.step === 'MAIN_MENU') {
      // First load of the widget — show the menu without requiring input.
      const result = await processFlowMessage({ text: '', state: INITIAL_STATE });
      return NextResponse.json({ message: result.reply, session: result.state });
    }

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const result = await processFlowMessage({ text: message, state: session });

    return NextResponse.json({ message: result.reply, session: result.state });
  } catch (error) {
    console.error('Reservation flow error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong.' },
      { status: 500 }
    );
  }
}