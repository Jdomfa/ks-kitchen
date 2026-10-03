const GRAPH_VERSION =
  process.env.WHATSAPP_GRAPH_VERSION || 'v21.0';

const PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID!;

const ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN!;

type WhatsAppApiResponse = {
  messaging_product?: string;

  contacts?: Array<{
    input: string;
    wa_id: string;
  }>;

  messages?: Array<{
    id: string;
    message_status?: string;
  }>;

  error?: {
    message: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

type WhatsAppTextArgs = {
  to: string;
  text: string;
};

type WhatsAppButton = {
  id: string;
  title: string;
};

type WhatsAppButtonsArgs = {
  to: string;
  body: string;
  buttons: WhatsAppButton[];
};

type WhatsAppTemplateArgs = {
  to: string;
  templateName: string;
  languageCode?: string;
  bodyParameters?: string[];
};

/* ============================================================
 * Config
 * ========================================================== */

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

/* ============================================================
 * Phone normalization
 * ========================================================== */

export function normalizeWhatsAppRecipient(
  phone: string
): string {
  let digits =
    phone.replace(/\D/g, '');

  /**
   * Nigeria:
   *
   * 08012345678
   * ->
   * 2348012345678
   */
  if (
    digits.length === 11 &&
    digits.startsWith('0')
  ) {
    digits =
      `234${digits.slice(1)}`;
  }

  return digits;
}

/* ============================================================
 * Graph API request
 * ========================================================== */

async function sendWhatsAppRequest(
  payload: Record<string, unknown>
): Promise<WhatsAppApiResponse> {
  assertWhatsAppConfig();

  const url =
    `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const response =
    await fetch(
      url,
      {
        method: 'POST',

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
 * Text messages
 *
 * Supports BOTH:
 *
 * sendWhatsAppMessage({
 *   to: phone,
 *   text: message
 * })
 *
 * AND old code:
 *
 * sendWhatsAppMessage(phone, message)
 * ========================================================== */

export function sendWhatsAppMessage(
  args: WhatsAppTextArgs
): Promise<WhatsAppApiResponse>;

export function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<WhatsAppApiResponse>;

export async function sendWhatsAppMessage(
  argsOrTo:
    | WhatsAppTextArgs
    | string,

  maybeText?: string
): Promise<WhatsAppApiResponse> {
  let to: string;
  let text: string;

  if (
    typeof argsOrTo ===
    'string'
  ) {
    to =
      argsOrTo;

    text =
      maybeText ?? '';
  } else {
    to =
      argsOrTo.to;

    text =
      argsOrTo.text;
  }

  if (!to) {
    throw new Error(
      'WhatsApp recipient is required.'
    );
  }

  if (!text) {
    throw new Error(
      'WhatsApp message text is required.'
    );
  }

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
 * Generic template
 * ========================================================== */

export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = 'en',
  bodyParameters = [],
}: WhatsAppTemplateArgs): Promise<WhatsAppApiResponse> {
  if (!to) {
    throw new Error(
      'WhatsApp recipient is required.'
    );
  }

  if (!templateName) {
    throw new Error(
      'WhatsApp template name is required.'
    );
  }

  const recipient =
    normalizeWhatsAppRecipient(
      to
    );

  const components =
    bodyParameters.length >
    0
      ? [
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
        ]
      : [];

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

      ...(components.length >
      0
        ? {
            components,
          }
        : {}),
    },
  });
}

/* ============================================================
 * Reservation confirmation template
 *
 * reservation_confirmation
 *
 * {{1}} Customer name
 * {{2}} Guests
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
}): Promise<WhatsAppApiResponse> {
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
 * Reservation update template
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
}): Promise<WhatsAppApiResponse> {
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
 * Interactive buttons
 *
 * Supports new style:
 *
 * sendWhatsAppButtons({
 *   to,
 *   body,
 *   buttons
 * })
 *
 * AND old style:
 *
 * sendWhatsAppButtons(
 *   to,
 *   body,
 *   buttons
 * )
 * ========================================================== */

export function sendWhatsAppButtons(
  args: WhatsAppButtonsArgs
): Promise<WhatsAppApiResponse>;

export function sendWhatsAppButtons(
  to: string,
  body: string,
  buttons: WhatsAppButton[]
): Promise<WhatsAppApiResponse>;

export async function sendWhatsAppButtons(
  argsOrTo:
    | WhatsAppButtonsArgs
    | string,

  maybeBody?: string,

  maybeButtons?: WhatsAppButton[]
): Promise<WhatsAppApiResponse> {
  let to: string;
  let body: string;
  let buttons: WhatsAppButton[];

  if (
    typeof argsOrTo ===
    'string'
  ) {
    to =
      argsOrTo;

    body =
      maybeBody ?? '';

    buttons =
      maybeButtons ?? [];
  } else {
    to =
      argsOrTo.to;

    body =
      argsOrTo.body;

    buttons =
      argsOrTo.buttons;
  }

  if (!to) {
    throw new Error(
      'WhatsApp recipient is required.'
    );
  }

  if (!body) {
    throw new Error(
      'WhatsApp button message body is required.'
    );
  }

  if (
    buttons.length ===
    0
  ) {
    throw new Error(
      'At least one WhatsApp button is required.'
    );
  }

  /**
   * WhatsApp reply-button messages support
   * a maximum of 3 reply buttons.
   */
  const safeButtons =
    buttons.slice(
      0,
      3
    );

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
          safeButtons.map(
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
 * Mark inbound message read
 * ========================================================== */

export async function markWhatsAppMessageRead(
  messageId: string
): Promise<WhatsAppApiResponse> {
  if (!messageId) {
    throw new Error(
      'WhatsApp message ID is required.'
    );
  }

  return sendWhatsAppRequest({
    messaging_product:
      'whatsapp',

    status:
      'read',

    message_id:
      messageId,
  });
}