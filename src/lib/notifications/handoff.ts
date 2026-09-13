import { sendWhatsAppMessage } from '@/lib/whatsapp/client';
import { siteConfig } from '@/lib/site-config';

export async function notifyStaffOfHandoff(args: {
  message: string;
  channel: 'website' | 'whatsapp';
  customerContact: string;
}): Promise<{ success: boolean; error?: string }> {
  const channelLabel = args.channel === 'whatsapp' ? 'WhatsApp' : 'Website chat';

  const text = `New customer enquiry (${channelLabel})\n\nContact: ${args.customerContact}\nMessage: ${args.message}`;

  try {
    await sendWhatsAppMessage(siteConfig.whatsappNumber, text);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown notification error.',
    };
  }
}