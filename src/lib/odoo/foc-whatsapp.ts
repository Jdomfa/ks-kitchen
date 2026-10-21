const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;
const ODOO_USERNAME = process.env.ODOO_USERNAME!;
const ODOO_API_KEY = process.env.ODOO_API_KEY!;

const TEMPLATE_NAME =
  "reservation_confirmation_v2";

let cachedUid: number | null = null;

type JsonRpcResult<T> = {
  result?: T;

  error?: {
    message?: string;

    data?: {
      message?: string;
      debug?: string;
    };
  };
};

type WhatsAppTemplate = {
  id: number;
  name: string;
  template_name: string;
  status: string;

  model:
    | string
    | false;

  variable_ids?: number[];
};

type PartnerRecord = {
  id: number;
  name: string;

  phone:
    | string
    | false;
};


/* ============================================================
 * Odoo authentication
 * ========================================================== */

async function getUid(): Promise<number> {
  if (cachedUid) {
    return cachedUid;
  }

  if (
    !ODOO_URL ||
    !ODOO_DB ||
    !ODOO_USERNAME ||
    !ODOO_API_KEY
  ) {
    throw new Error(
      "Missing Odoo environment variables.",
    );
  }

  const response =
    await fetch(
      `${ODOO_URL}/jsonrpc`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          jsonrpc: "2.0",

          method: "call",

          params: {
            service: "common",

            method:
              "authenticate",

            args: [
              ODOO_DB,
              ODOO_USERNAME,
              ODOO_API_KEY,
              {},
            ],
          },

          id: Date.now(),
        }),

        cache: "no-store",
      },
    );

  if (!response.ok) {
    throw new Error(
      `Odoo authentication failed with HTTP ${response.status}`,
    );
  }

  const data =
    (await response.json()) as JsonRpcResult<number>;

  if (
    data.error ||
    !data.result
  ) {
    throw new Error(
      data.error?.data?.message ??
        data.error?.message ??
        "Odoo authentication failed.",
    );
  }

  cachedUid =
    data.result;

  return cachedUid;
}


/* ============================================================
 * JSON-RPC helper
 * ========================================================== */

async function odooCall<T>(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  const uid =
    await getUid();

  const response =
    await fetch(
      `${ODOO_URL}/jsonrpc`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          jsonrpc: "2.0",

          method: "call",

          params: {
            service: "object",

            method:
              "execute_kw",

            args: [
              ODOO_DB,
              uid,
              ODOO_API_KEY,
              model,
              method,
              args,
              kwargs,
            ],
          },

          id: Date.now(),
        }),

        cache: "no-store",
      },
    );

  const data =
    (await response.json()) as JsonRpcResult<T>;

  if (data.error) {
    console.error(
      "FOC WhatsApp Odoo RPC error",
      {
        model,
        method,

        message:
          data.error.message,

        detail:
          data.error.data?.message,
      },
    );

    throw new Error(
      data.error.data?.message ??
        data.error.message ??
        `${model}.${method} failed`,
    );
  }

  return data.result as T;
}


/* ============================================================
 * Phone
 * ========================================================== */

function normalizePhone(
  value: string,
): string {
  let phone =
    value
      .trim()
      .replace(
        /[\s()-]/g,
        "",
      );

  if (
    phone.startsWith("00")
  ) {
    phone =
      `+${phone.slice(2)}`;
  }

  if (
    phone.startsWith("0")
  ) {
    phone =
      `+234${phone.slice(1)}`;
  }

  if (
    !phone.startsWith("+") &&
    /^\d+$/.test(phone)
  ) {
    phone =
      `+${phone}`;
  }

  return phone;
}


/* ============================================================
 * Partner
 * ========================================================== */

async function findOrCreatePartner(
  name: string,
  phone: string,
): Promise<number> {
  const partners =
    await odooCall<
      PartnerRecord[]
    >(
      "res.partner",
      "search_read",
      [
        [
          [
            "phone",
            "=",
            phone,
          ],
        ],
      ],
      {
        fields: [
          "id",
          "name",
          "phone",
        ],

        limit: 1,
      },
    );

  if (
    partners.length >
    0
  ) {
    const partner =
      partners[0];

    /*
     * Keep the name current.
     * Do not change phone here because
     * this is the number we matched on.
     */
    if (
      name &&
      partner.name !==
        name
    ) {
      await odooCall<boolean>(
        "res.partner",
        "write",
        [
          [
            partner.id,
          ],

          {
            name,
          },
        ],
      );
    }

    return partner.id;
  }

  const partnerId =
    await odooCall<number>(
      "res.partner",
      "create",
      [
        {
          name,
          phone,
        },
      ],
    );

  return partnerId;
}


/* ============================================================
 * Find V3 template
 * ========================================================== */

async function getV3Template(): Promise<WhatsAppTemplate> {
  const templates =
    await odooCall<
      WhatsAppTemplate[]
    >(
      "whatsapp.template",
      "search_read",
      [
        [
          [
            "template_name",
            "=",
            TEMPLATE_NAME,
          ],

          [
            "status",
            "=",
            "approved",
          ],
        ],
      ],
      {
        fields: [
          "id",
          "name",
          "template_name",
          "status",
          "model",
          "variable_ids",
        ],

        limit: 1,
      },
    );

  console.log(
    "FOC V3 TEMPLATE LOOKUP",
    templates,
  );

  if (
    templates.length ===
    0
  ) {
    throw new Error(
      `Approved WhatsApp template ${TEMPLATE_NAME} was not found in Odoo.`,
    );
  }

  return templates[0];
}


/* ============================================================
 * FOC WhatsApp confirmation
 * ========================================================== */

export async function sendFocReservationWhatsApp(
  input: {
    name: string;
    phone: string;
    partySize: number;
    date: string;
    time: string;
    reservationCode: string;
  },
) {
  const name =
    input.name.trim();

  const phone =
    normalizePhone(
      input.phone,
    );

  console.log(
    "=== FOC WHATSAPP START ===",
    {
      name,
      phone,

      partySize:
        input.partySize,

      date:
        input.date,

      time:
        input.time,

      reservationCode:
        input.reservationCode,
    },
  );

  if (!phone) {
    throw new Error(
      "FOC WhatsApp phone number is empty.",
    );
  }


  /* ----------------------------------------------------------
   * 1. Get approved V3 template
   * -------------------------------------------------------- */

  const template =
    await getV3Template();

  console.log(
    "FOC V3 TEMPLATE",
    {
      id:
        template.id,

      name:
        template.name,

      technicalName:
        template.template_name,

      status:
        template.status,

      model:
        template.model,

      variableIds:
        template.variable_ids,
    },
  );

  /*
   * V3 must be a res.partner template
   * because we are sending against the
   * customer partner record.
   */
  if (
    template.model !==
    "res.partner"
  ) {
    throw new Error(
      `V3 template model is ${String(
        template.model,
      )}, expected res.partner.`,
    );
  }


  /* ----------------------------------------------------------
   * 2. Create/find recipient partner
   * -------------------------------------------------------- */

  const partnerId =
    await findOrCreatePartner(
      name,
      phone,
    );

  console.log(
    "FOC WHATSAPP PARTNER",
    {
      partnerId,
      phone,
    },
  );


  /* ----------------------------------------------------------
   * 3. Create Odoo WhatsApp composer
   *
   * Odoo's own server action does this exact pattern:
   *
   * res_ids
   * res_model
   * wa_template_id
   *
   * then calls:
   * _send_whatsapp_template(...)
   * -------------------------------------------------------- */

  const composerId =
    await odooCall<number>(
      "whatsapp.composer",
      "create",
      [
        {
          res_ids: [
            partnerId,
          ],

          res_model:
            "res.partner",

          wa_template_id:
            template.id,
        },
      ],
    );

  console.log(
    "FOC WHATSAPP COMPOSER CREATED",
    {
      composerId,
      partnerId,

      templateId:
        template.id,
    },
  );


  /* ----------------------------------------------------------
   * 4. Send synchronously
   *
   * IMPORTANT:
   * Await this. Do not fire-and-forget on Vercel.
   * -------------------------------------------------------- */

  console.log(
    "FOC WHATSAPP ABOUT TO SEND",
    {
      composerId,
    },
  );

  const sendResult =
    await odooCall<unknown>(
      "whatsapp.composer",
      "_send_whatsapp_template",
      [
        [
          composerId,
        ],
      ],
      {
        force_send_by_cron:
          true,
      },
    );

  console.log(
    "FOC WHATSAPP SEND RESULT",
    sendResult,
  );


  /* ----------------------------------------------------------
   * 5. Inspect most recent message for this partner/template.
   *
   * Composer returning successfully only means Odoo accepted
   * the operation. We want visibility into the WhatsApp message.
   * -------------------------------------------------------- */

  const messages =
    await odooCall<
      Array<{
        id: number;
        state: string;
        failure_type:
          | string
          | false;

        failure_reason:
          | string
          | false;

        mobile_number:
          | string
          | false;

        msg_uid:
          | string
          | false;

        wa_template_id:
          | [number, string]
          | false;
      }>
    >(
      "whatsapp.message",
      "search_read",
      [
        [
          [
            "wa_template_id",
            "=",
            template.id,
          ],

          [
            "mobile_number",
            "ilike",
            phone.replace(
              "+",
              "",
            ),
          ],
        ],
      ],
      {
        fields: [
          "id",
          "state",
          "failure_type",
          "failure_reason",
          "mobile_number",
          "msg_uid",
          "wa_template_id",
        ],

        order:
          "id desc",

        limit: 1,
      },
    );

  console.log(
    "FOC WHATSAPP MESSAGE CHECK",
    messages,
  );

  const message =
    messages[0];

  if (
    message &&
    (
      message.state ===
        "error" ||
      message.state ===
        "bounced" ||
      message.state ===
        "cancel"
    )
  ) {
    throw new Error(
      message.failure_reason ||
        message.failure_type ||
        `WhatsApp message ended in state ${message.state}`,
    );
  }

  console.log(
    "=== FOC WHATSAPP COMPLETE ===",
    {
      composerId,

      messageId:
        message?.id,

      state:
        message?.state,

      msgUid:
        message?.msg_uid,
    },
  );

  return {
    success: true,

    composerId,

    messageId:
      message?.id,

    state:
      message?.state,

    msgUid:
      message?.msg_uid,
  };
}
