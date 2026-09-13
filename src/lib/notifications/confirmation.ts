import { sendReservationConfirmationEmail } from './email';
import { sendReservationConfirmationSms, normalizePhoneNumber } from './sms';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';

type SendConfirmationsArgs = {
  name: string;
  email?: string;
  phone?: string;
  partySize: number;
  date: string;
  time: string;
  originChannel: 'website' | 'whatsapp';
};

type ConfirmationOutcome = {
  email: { success: boolean; error?: string; skipped?: boolean };
  sms: { success: boolean; error?: string; skipped?: boolean };
  whatsapp: { success: boolean; error?: string; skipped?: boolean };
};

export async function sendReservationConfirmations(
  args: SendConfirmationsArgs
): Promise<ConfirmationOutcome> {
  const normalizedPhone = args.phone ? normalizePhoneNumber(args.phone) : null;

  const emailPromise = args.email
    ? sendReservationConfirmationEmail({
        to: args.email,
        name: args.name,
        partySize: args.partySize,
        date: args.date,
        time: args.time,
      })
    : Promise.resolve({ success: false, skipped: true });

  const smsPromise = normalizedPhone
    ? sendReservationConfirmationSms({
        to: normalizedPhone,
        name: args.name,
        partySize: args.partySize,
        date: args.date,
        time: args.time,
      })
    : Promise.resolve({ success: false, skipped: true });

  const whatsappPromise =
    args.originChannel === 'whatsapp' || !normalizedPhone
      ? Promise.resolve({ success: false, skipped: true })
      : sendWhatsAppMessage(
          normalizedPhone,
          `Hi ${args.name}, your table for ${args.partySize} on ${args.date} at ${args.time} is confirmed at K's Kitchen Gourmet. See you soon!`
        )
          .then(() => ({ success: true }))
          .catch((error) => ({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown WhatsApp error.',
          }));

  const [email, sms, whatsapp] = await Promise.all([emailPromise, smsPromise, whatsappPromise]);

  return { email, sms, whatsapp };
}