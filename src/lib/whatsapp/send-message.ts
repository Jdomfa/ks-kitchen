const GRAPH_VERSION = 'v23.0';

type WhatsAppButton = {
  id: string;
  title: string;
};

export async function sendWhatsAppMainMenu(
  to: string
): Promise<unknown> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('Missing WhatsApp environment variables');
  }

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: "Welcome to K's Kitchen! How can I help?",
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: 'menu_reservation',
                  title: 'Reservations',
                },
              },
              {
                type: 'reply',
                reply: {
                  id: 'menu_enquiries',
                  title: 'Enquiries',
                },
              },
              {
                type: 'reply',
                reply: {
                  id: 'menu_menu',
                  title: 'Menu',
                },
              },
            ],
          },
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error('WhatsApp API error:', data);
    throw new Error(
      data?.error?.message || 'Failed to send WhatsApp message'
    );
  }

  return data;
}