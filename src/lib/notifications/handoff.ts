import { sendWhatsAppMessage } from '@/lib/whatsapp/client';

const STAFF_WHATSAPP_NUMBER = process.env.STAFF_WHATSAPP_NUMBER;

export async function notifyStaffOfHandoff(args: {
  message: string;
  channel: 'website' | 'whatsapp';
  customerContact: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!STAFF_WHATSAPP_NUMBER) {
    return { success: false, error: 'STAFF_WHATSAPP_NUMBER is not configured.' };
  }

  const channelLabel = args.channel === 'whatsapp' ? 'WhatsApp' : 'Website chat';

  const text = `New customer enquiry (${channelLabel})\n\nContact: ${args.customerContact}\nMessage: ${args.message}`;

  try {
    await sendWhatsAppMessage(STAFF_WHATSAPP_NUMBER, text);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown notification error.',
    };
  }
}