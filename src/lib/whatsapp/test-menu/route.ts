import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMainMenu } from '@/lib/whatsapp/send-message';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.to) {
      return NextResponse.json(
        { error: 'Missing "to" phone number' },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMainMenu(body.to);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}