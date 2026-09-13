import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

type ReservationSmsArgs = {
  to: string; // must be E.164 format, e.g. +2348012345678
  name: string;
  partySize: number;
  date: string;
  time: string;
};

/**
 * Normalizes a locally-entered Nigerian phone number into E.164 format.
 * Falls back to null if the input can't be confidently normalized.
 */
export function normalizePhoneNumber(raw: string): string | null {
  const trimmed = raw.trim().replace(/[\s-()]/g, '');

  if (/^\+\d{8,15}$/.test(trimmed)) {
    return trimmed;
  }

  // Local Nigerian format starting with 0, e.g. 08012345678
  if (/^0\d{9,10}$/.test(trimmed)) {
    return `+234${trimmed.slice(1)}`;
  }

  // Bare digits with no leading 0 or +, assume Nigeria if plausible length
  if (/^\d{9,10}$/.test(trimmed)) {
    return `+234${trimmed}`;
  }

  return null;
}

export async function sendReservationConfirmationSms(
  args: ReservationSmsArgs
): Promise<{ success: boolean; error?: string }> {
  if (!FROM_NUMBER) {
    return { success: false, error: 'TWILIO_PHONE_NUMBER is not configured.' };
  }

  try {
    await client.messages.create({
      to: args.to,
      from: FROM_NUMBER,
      body: `K's Kitchen Gourmet: Hi ${args.name}, your table for ${args.partySize} on ${args.date} at ${args.time} is confirmed. See you soon!`,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SMS error.',
    };
  }
}