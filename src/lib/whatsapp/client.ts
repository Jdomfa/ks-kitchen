const GRAPH_VERSION =
  process.env.WHATSAPP_GRAPH_VERSION || "v21.0";

const PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID;

const ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN;

/* ============================================================
 * Types
 * ========================================================== */

export type WhatsAppTemplateParameter =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "currency";
      currency: {
        fallback_value: string;
        code: string;
        amount_1000: number;
      };
    }
  | {
      type: "date_time";
      date_time: {
        fallback_value: string;
      };
    };

export type WhatsAppTemplateComponent = {
  type:
    | "header"
    | "body"
    | "button";

  sub_type?:
    | "url"
    | "quick_reply";

  index?: string;

  parameters:
    WhatsAppTemplateParameter[];
};

/* ============================================================
 * Configuration
 * ========================================================== */

function getWhatsAppConfig() {
  if (!PHONE_NUMBER_ID) {
    throw new Error(
      "WHATSAPP_PHONE_NUMBER_ID is not configured."
    );
  }

  if (!ACCESS_TOKEN) {
    throw new Error(
      "WHATSAPP_ACCESS_TOKEN is not configured."
    );
  }

  return {
    url:
      `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`,

    accessToken:
      ACCESS_TOKEN,
  };
}

/* ============================================================
 * Phone normalization
 * ========================================================== */

export function normalizeWhatsAppRecipient(
  phone: string
): string {
  const digits =
    phone.replace(/\D/g, "");

  if (!digits) {
    throw new Error(
      "WhatsApp recipient phone number is empty."
    );
  }

  /**
   * Nigerian local number:
   *
   * 08012345678
   * ->
   * 2348012345678
   */
  if (
    digits.length === 11 &&
    digits.startsWith("0")
  ) {
    return `234${digits.slice(1)}`;
  }

  return digits;
}

/* ============================================================
 * Generic Graph request
 * ========================================================== */

async function sendWhatsAppRequest(
  payload: Record<string, unknown>
) {
  const {
    url,
    accessToken,
  } = getWhatsAppConfig();

  const response =
    await fetch(
      url,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            payload
          ),
      }
    );

  const responseText =
    await response.text();

  let responseBody:
    unknown = null;

  if (responseText) {
    try {
      responseBody =
        JSON.parse(
          responseText
        );
    } catch {
      responseBody =
        responseText;
    }
  }

  if (!response.ok) {
    console.error(
      "WhatsApp Graph API error:",
      responseBody
    );

    throw new Error(
      `WhatsApp request failed (${response.status}): ${
        typeof responseBody === "string"
          ? responseBody
          : JSON.stringify(
              responseBody
            )
      }`
    );
  }

  return responseBody;
}

/* ============================================================
 * Plain text message
 * ========================================================== */

export async function sendWhatsAppMessage(
  to: string,
  text: string
) {
  const recipient =
    normalizeWhatsAppRecipient(
      to
    );

  if (!text.trim()) {
    throw new Error(
      "Cannot send an empty WhatsApp message."
    );
  }

  return sendWhatsAppRequest({
    messaging_product:
      "whatsapp",

    recipient_type:
      "individual",

    to:
      recipient,

    type:
      "text",

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
  languageCode = "en",
  components = [],
}: {
  to: string;

  templateName: string;

  languageCode?: string;

  components?:
    WhatsAppTemplateComponent[];
}) {
  const recipient =
    normalizeWhatsAppRecipient(
      to
    );

  if (!templateName.trim()) {
    throw new Error(
      "WhatsApp template name is required."
    );
  }

  return sendWhatsAppRequest({
    messaging_product:
      "whatsapp",

    recipient_type:
      "individual",

    to:
      recipient,

    type:
      "template",

    template: {
      name:
        templateName,

      language: {
        code:
          languageCode,
      },

      ...(components.length > 0
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
 * Meta template:
 *
 * Name:
 * reservation_confirmation
 *
 * Header:
 * Reservation Confirmed
 *
 * Body:
 *
 * Hi {{1}}, your reservation at K's Kitchen Gourmet is confirmed ✅
 *
 * Guests: {{2}}
 * Date: {{3}}
 * Time: {{4}}
 * Reservation code: {{5}}
 *
 * We look forward to welcoming you.
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
      "reservation_confirmation",

    languageCode:
      "en",

    components: [
      {
        type:
          "body",

        parameters: [
          {
            type:
              "text",

            text:
              name,
          },

          {
            type:
              "text",

            text:
              String(
                partySize
              ),
          },

          {
            type:
              "text",

            text:
              date,
          },

          {
            type:
              "text",

            text:
              time,
          },

          {
            type:
              "text",

            text:
              reservationCode,
          },
        ],
      },
    ],
  });
}

/* ============================================================
 * Reservation updated template
 *
 * Meta template:
 *
 * Name:
 * reservation_updated
 *
 * Header:
 * Reservation Updated
 *
 * Body:
 *
 * Hi {{1}}, your reservation at K's Kitchen Gourmet has been updated ✅
 *
 * Guests: {{2}}
 * New date: {{3}}
 * New time: {{4}}
 * Reservation code: {{5}}
 *
 * We look forward to welcoming you.
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
      "reservation_updated",

    languageCode:
      "en",

    components: [
      {
        type:
          "body",

        parameters: [
          {
            type:
              "text",

            text:
              name,
          },

          {
            type:
              "text",

            text:
              String(
                partySize
              ),
          },

          {
            type:
              "text",

            text:
              date,
          },

          {
            type:
              "text",

            text:
              time,
          },

          {
            type:
              "text",

            text:
              reservationCode,
          },
        ],
      },
    ],
  });
}

/* ============================================================
 * Interactive messages
 * ========================================================== */

export async function sendWhatsAppButtons(
  to: string,

  bodyText: string,

  buttons: {
    id: string;
    title: string;
  }[]
) {
  const recipient =
    normalizeWhatsAppRecipient(
      to
    );

  if (!bodyText.trim()) {
    throw new Error(
      "WhatsApp interactive message body cannot be empty."
    );
  }

  if (
    buttons.length ===
    0
  ) {
    throw new Error(
      "At least one WhatsApp button is required."
    );
  }

  const interactive =
    buttons.length > 3
      ? {
          type:
            "list",

          body: {
            text:
              bodyText,
          },

          action: {
            button:
              "Choose an option",

            sections: [
              {
                title:
                  "Options",

                rows:
                  buttons
                    .slice(
                      0,
                      10
                    )
                    .map(
                      (
                        button
                      ) => ({
                        id:
                          button.id,

                        title:
                          button.title.slice(
                            0,
                            24
                          ),
                      })
                    ),
              },
            ],
          },
        }
      : {
          type:
            "button",

          body: {
            text:
              bodyText,
          },

          action: {
            buttons:
              buttons.map(
                (
                  button
                ) => ({
                  type:
                    "reply",

                  reply: {
                    id:
                      button.id,

                    title:
                      button.title.slice(
                        0,
                        20
                      ),
                  },
                })
              ),
          },
        };

  return sendWhatsAppRequest({
    messaging_product:
      "whatsapp",

    recipient_type:
      "individual",

    to:
      recipient,

    type:
      "interactive",

    interactive,
  });
}

/* ============================================================
 * Read receipt
 * ========================================================== */

export async function markWhatsAppMessageRead(
  messageId: string
) {
  if (!messageId.trim()) {
    return;
  }

  try {
    await sendWhatsAppRequest({
      messaging_product:
        "whatsapp",

      status:
        "read",

      message_id:
        messageId,
    });
  } catch (
    error
  ) {
    console.error(
      "Failed to mark WhatsApp message as read:",
      error
    );
  }
}