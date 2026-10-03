const GRAPH_VERSION =
  process.env.WHATSAPP_GRAPH_VERSION ||
  'v21.0';

const PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID!;

const ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN!;

type WhatsAppApiResponse = {
  messaging_product?: string;

  contacts?: {
    input: string;
    wa_id: string;
  }[];

  messages?: {
    id: string;
    message_status?: string;
  }[];

  error?: {
    message: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

function assertWhatsAppConfig() {
  const missing: string[] = [];

  if (!PHONE_NUMBER_ID) {
    missing.push(
      'WHATSAPP_PHONE_NUMBER_ID'
    );
  }

  if (!ACCESS_TOKEN) {
    missing.push(
      'WHATSAPP_ACCESS_TOKEN'
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing WhatsApp environment variables: ${missing.join(
        ', '
      )}`
    );
  }
}

export function normalizeWhatsAppRecipient(
  phone: string
): string {
  let digits =
    phone.replace(
      /\D/g,
      ''
    );

  /**
   * Nigerian local format:
   * 08012345678
   *
   * becomes:
   * 2348012345678
   */
  if (
    digits.length === 11 &&
    digits.startsWith('0')
  ) {
    digits =
      `234${digits.slice(
        1
      )}`;
  }

  return digits;
}

async function sendWhatsAppRequest(
  payload: Record<
    string,
    unknown
  >
): Promise<WhatsAppApiResponse> {
  assertWhatsAppConfig();

  const url =
    `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const response =
    await fetch(
      url,
      {
        method:
          'POST',

        headers: {
          Authorization:
            `Bearer ${ACCESS_TOKEN}`,

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify(
            payload
          ),
      }
    );

  const data =
    (await response.json()) as WhatsAppApiResponse;

  if (!response.ok) {
    console.error(
      'WhatsApp Graph API error:',
      data
    );

    throw new Error(
      data.error?.message ||
        `WhatsApp request failed with status ${response.status}`
    );
  }

  return data;
}

/* ============================================================
 * Plain text message
 * ========================================================== */

export async function sendWhatsAppMessage({
  to,
  text,
}: {
  to: string;
  text: string;
}) {
  const recipient =
    normalizeWhatsAppRecipient(
      to
    );

  return sendWhatsAppRequest({
    messaging_product:
      'whatsapp',

    recipient_type:
      'individual',

    to:
      recipient,

    type:
      'text',

    text: {
      preview_url:
        false,

      body:
        text,
    },
  });
}

/* ============================================================
 * Generic template sender
 * ========================================================== */

export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = 'en',
  bodyParameters = [],
}: {
  to: string;
  templateName: string;
  languageCode?: string;
  bodyParameters?: string[];
}) {
  const recipient =
    normalizeWhatsAppRecipient(
      to
    );

  return sendWhatsAppRequest({
    messaging_product:
      'whatsapp',

    recipient_type:
      'individual',

    to:
      recipient,

    type:
      'template',

    template: {
      name:
        templateName,

      language: {
        code:
          languageCode,
      },

      components: [
        {
          type:
            'body',

          parameters:
            bodyParameters.map(
              (
                value
              ) => ({
                type:
                  'text',

                text:
                  value,
              })
            ),
        },
      ],
    },
  });
}

/* ============================================================
 * Reservation confirmation template
 *
 * Template:
 *
 * reservation_confirmation
 *
 * {{1}} Customer name
 * {{2}} Guest count
 * {{3}} Date
 * {{4}} Time
 * {{5}} Reservation code
 * ========================================================== */

export async function sendReservationConfirmationTemplate({
  to,
  name,
  partySize,
  date,
  time,
  reservationCode,
}: {
  to: string;
  name: string;
  partySize: number;
  date: string;
  time: string;
  reservationCode: string;
}) {
  return sendWhatsAppTemplate({
    to,

    templateName:
      'reservation_confirmation',

    languageCode:
      'en',

    bodyParameters: [
      name,
      String(
        partySize
      ),
      date,
      time,
      reservationCode,
    ],
  });
}

/* ============================================================
 * Reservation updated template
 * ========================================================== */

export async function sendReservationUpdatedTemplate({
  to,
  name,
  partySize,
  date,
  time,
  reservationCode,
}: {
  to: string;
  name: string;
  partySize: number;
  date: string;
  time: string;
  reservationCode: string;
}) {
  return sendWhatsAppTemplate({
    to,

    templateName:
      'reservation_updated',

    languageCode:
      'en',

    bodyParameters: [
      name,
      String(
        partySize
      ),
      date,
      time,
      reservationCode,
    ],
  });
}

/* ============================================================
 * Buttons
 * ========================================================== */

export async function sendWhatsAppButtons({
  to,
  body,
  buttons,
}: {
  to: string;
  body: string;
  buttons: {
    id: string;
    title: string;
  }[];
}) {
  const recipient =
    normalizeWhatsAppRecipient(
      to
    );

  return sendWhatsAppRequest({
    messaging_product:
      'whatsapp',

    recipient_type:
      'individual',

    to:
      recipient,

    type:
      'interactive',

    interactive: {
      type:
        'button',

      body: {
        text:
          body,
      },

      action: {
        buttons:
          buttons.map(
            (
              button
            ) => ({
              type:
                'reply',

              reply: {
                id:
                  button.id,

                title:
                  button.title,
              },
            })
          ),
      },
    },
  });
}

/* ============================================================
 * Mark incoming message as read
 * ========================================================== */

export async function markWhatsAppMessageRead(
  messageId: string
) {
  return sendWhatsAppRequest({
    messaging_product:
      'whatsapp',

    status:
      'read',

    message_id:
      messageId,
  });
}