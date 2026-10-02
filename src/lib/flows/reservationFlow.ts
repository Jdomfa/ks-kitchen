import {
  getBookableReservationTimes,
} from "@/lib/odoo/reservation-allocation";

import {
  createOdooReservation,
  getOdooReservationByCode,
  getOdooReservationByPhone,
  cancelOdooReservation,
  modifyOdooReservation,
} from "@/lib/odoo/reservations";

import {
  sendReservationConfirmations,
  sendReservationUpdateConfirmation,
} from "@/lib/notifications/confirmation";

import {
  notifyStaffOfHandoff,
} from "@/lib/notifications/handoff";

import {
  createHelpdeskTicket,
} from "@/lib/odoo/client";

import {
  siteConfig,
} from "@/lib/site-config";

/* ============================================================
 * Flow types
 * ========================================================== */

export type FlowStep =
  | "MAIN_MENU"
  | "RESERVATION_MENU"
  | "ENQUIRY_MENU"
  | "ENQUIRY_HANDOFF_MESSAGE"
  | "ENQUIRY_HANDOFF_CONTACT"
  | "RESERVATION_PARTY_SIZE"
  | "RESERVATION_DATE"
  | "RESERVATION_TIME"
  | "RESERVATION_NAME"
  | "RESERVATION_PHONE"
  | "RESERVATION_CONFIRM"
  | "MANAGE_CODE"
  | "MANAGE_ACTION"
  | "MANAGE_MODIFY_DATE"
  | "MANAGE_MODIFY_TIME";

export type ReservationDraft = {
  name?: string;
  partySize?: number;
  date?: string;
  time?: string;
  phone?: string;
};

export type FlowState = {
  step: FlowStep;

  draft: ReservationDraft;

  alternatives?: string[];

  handoffMessage?: string;

  manageCode?: string;

  managePartySize?: number;

  manageName?: string;

  managePhone?: string;
};

export const INITIAL_STATE: FlowState = {
  step: "MAIN_MENU",
  draft: {},
};

export type FlowButton = {
  id: string;
  title: string;
  url?: string;
};

export type SummaryRow = {
  label: string;
  value: string;
};

export type FlowResult = {
  reply: string;

  state: FlowState;

  buttons?: FlowButton[];

  inputType?: "date";

  summary?: SummaryRow[];
};

/* ============================================================
 * Main menu
 * ========================================================== */

const MENU_TEXT = `
https://menu.ks.kitchen
`.trim();

const MAIN_MENU_TEXT =
  "Welcome to K's Kitchen! How can I help?";

const MAIN_MENU_BUTTONS: FlowButton[] = [
  {
    id: "menu_reservation",
    title: "Reservations",
  },

  {
    id: "menu_enquiries",
    title: "Enquiries",
  },

  {
    id: "menu_menu",
    title: "Menu",
  },
];

/* ============================================================
 * Reservation menu
 * ========================================================== */

const RESERVATION_MENU_TEXT =
  "Would you like to make a new reservation, or manage an existing one?";

const RESERVATION_MENU_BUTTONS: FlowButton[] = [
  {
    id: "new",
    title: "New reservation",
  },

  {
    id: "manage",
    title: "Manage existing",
  },
];

const PARTY_SIZE_BUTTONS: FlowButton[] = [
  {
    id: "1",
    title: "1 guest",
  },

  {
    id: "2",
    title: "2 guests",
  },

  {
    id: "3",
    title: "3 guests",
  },

  {
    id: "4",
    title: "4 guests",
  },

  {
    id: "5+",
    title: "5+ guests",
  },
];

/* ============================================================
 * WhatsApp agent support
 * ========================================================== */

function getWhatsAppAgentButton(): FlowButton {
  const whatsappNumber =
    siteConfig.whatsappNumber.replace(
      /\D/g,
      ""
    );

  const message =
    encodeURIComponent(
      "Hi, I need help with a reservation."
    );

  return {
    id: "talk_to_agent",

    title:
      "Talk to an agent on WhatsApp",

    url:
      `https://wa.me/${whatsappNumber}?text=${message}`,
  };
}

function withWhatsAppAgent(
  buttons: FlowButton[] = []
): FlowButton[] {
  return [
    ...buttons,
    getWhatsAppAgentButton(),
  ];
}

/* ============================================================
 * Enquiries
 * ========================================================== */

const ENQUIRY_TOPICS = {
  hours: {
    label:
      "Opening Hours",

    text:
      siteConfig.hours
        .map(
          (hours) =>
            `${hours.days}: ${hours.time}`
        )
        .join("\n"),
  },

  location: {
    label:
      "Location",

    text:
      `${siteConfig.address.line1}, ${siteConfig.address.line2}\n` +
      `Dine-in available via reservation or walk-in.\n` +
      `${siteConfig.address.map}`,
  },

  takeaway: {
    label:
      "Takeaway & Delivery",

    text:
      `Takeaway: Yes, takeouts are possible.\n` +
      `Delivery: We haven't started deliveries yet but when we do we'd be sure to let you know.\n` +
      `Orders: ${siteConfig.orderEmail}`,
  },

  contact: {
    label:
      "Contact & Parking",

    text:
      `Phone: ${siteConfig.reservationPhone}\n` +
      `Email: ${siteConfig.reservationEmail}\n` +
      `Parking: TODO — confirm availability.`,
  },
} as const;

type EnquiryTopicKey =
  keyof typeof ENQUIRY_TOPICS;

const ENQUIRY_MENU_BUTTONS: FlowButton[] = [
  {
    id: "1",
    title: "Opening Hours",
  },

  {
    id: "2",
    title: "Location",
  },

  {
    id: "3",
    title: "Takeaway & Delivery",
  },

  {
    id: "4",
    title: "Contact & Parking",
  },

  {
    id: "5",
    title: "Talk to our team",
  },
];

/* ============================================================
 * Date helpers
 * ========================================================== */

function getLagosTodayISO(): string {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "Africa/Lagos",

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",
    }
  ).format(
    new Date()
  );
}

const MONTH_NAMES:
  Record<string, number> = {
  jan: 0,
  january: 0,

  feb: 1,
  february: 1,

  mar: 2,
  march: 2,

  apr: 3,
  april: 3,

  may: 4,

  jun: 5,
  june: 5,

  jul: 6,
  july: 6,

  aug: 7,
  august: 7,

  sep: 8,
  sept: 8,
  september: 8,

  oct: 9,
  october: 9,

  nov: 10,
  november: 10,

  dec: 11,
  december: 11,
};

function buildDateISO(
  year: number,
  monthIndex: number,
  day: number
): string | null {
  const date =
    new Date(
      Date.UTC(
        year,
        monthIndex,
        day
      )
    );

  if (
    date.getUTCFullYear() !==
      year ||
    date.getUTCMonth() !==
      monthIndex ||
    date.getUTCDate() !==
      day
  ) {
    return null;
  }

  return date
    .toISOString()
    .slice(
      0,
      10
    );
}

function parseDateInput(
  raw: string
): string | null {
  const text =
    raw
      .trim()
      .toLowerCase();

  const todayISO =
    getLagosTodayISO();

  if (
    text ===
    "today"
  ) {
    return todayISO;
  }

  if (
    text ===
    "tomorrow"
  ) {
    const date =
      new Date(
        `${todayISO}T00:00:00Z`
      );

    date.setUTCDate(
      date.getUTCDate() +
        1
    );

    return date
      .toISOString()
      .slice(
        0,
        10
      );
  }

  /**
   * Website date picker.
   */
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {
    return text;
  }

  /**
   * DD/MM/YYYY
   * DD-MM-YYYY
   */
  const numeric =
    text.match(
      /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
    );

  if (
    numeric
  ) {
    const [
      ,
      day,
      month,
      year,
    ] =
      numeric;

    return buildDateISO(
      parseInt(
        year,
        10
      ),

      parseInt(
        month,
        10
      ) - 1,

      parseInt(
        day,
        10
      )
    );
  }

  const currentYear =
    parseInt(
      todayISO.slice(
        0,
        4
      ),
      10
    );

  /**
   * 12 September
   * 12th September
   * 12 September 2026
   */
  const dayFirst =
    text.match(
      /^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\.?(?:\s+(\d{4}))?$/
    );

  if (
    dayFirst
  ) {
    const [
      ,
      dayString,
      monthString,
      yearString,
    ] =
      dayFirst;

    const monthIndex =
      MONTH_NAMES[
        monthString
      ];

    if (
      monthIndex !==
      undefined
    ) {
      const year =
        yearString
          ? parseInt(
              yearString,
              10
            )
          : currentYear;

      let iso =
        buildDateISO(
          year,
          monthIndex,
          parseInt(
            dayString,
            10
          )
        );

      if (
        iso &&
        !yearString &&
        iso <
          todayISO
      ) {
        iso =
          buildDateISO(
            year + 1,
            monthIndex,
            parseInt(
              dayString,
              10
            )
          );
      }

      return iso;
    }
  }

  /**
   * September 12
   * September 12, 2026
   */
  const monthFirst =
    text.match(
      /^([a-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?$/
    );

  if (
    monthFirst
  ) {
    const [
      ,
      monthString,
      dayString,
      yearString,
    ] =
      monthFirst;

    const monthIndex =
      MONTH_NAMES[
        monthString
      ];

    if (
      monthIndex !==
      undefined
    ) {
      const year =
        yearString
          ? parseInt(
              yearString,
              10
            )
          : currentYear;

      let iso =
        buildDateISO(
          year,
          monthIndex,
          parseInt(
            dayString,
            10
          )
        );

      if (
        iso &&
        !yearString &&
        iso <
          todayISO
      ) {
        iso =
          buildDateISO(
            year + 1,
            monthIndex,
            parseInt(
              dayString,
              10
            )
          );
      }

      return iso;
    }
  }

  return null;
}

/* ============================================================
 * Helpers
 * ========================================================== */

function isGlobalReset(
  text: string
): boolean {
  const value =
    text
      .trim()
      .toLowerCase();

  return (
    value ===
      "0" ||
    value ===
      "menu" ||
    value ===
      "restart" ||
    value ===
      "back"
  );
}

function formatDisplayTime(
  time: string
): string {
  const [
    hoursString,
    minutesString,
  ] =
    time.split(
      ":"
    );

  const hours =
    Number(
      hoursString
    );

  const minutes =
    Number(
      minutesString
    );

  const period =
    hours >= 12
      ? "PM"
      : "AM";

  const displayHour =
    hours % 12 ===
    0
      ? 12
      : hours % 12;

  const displayMinutes =
    minutes === 0
      ? ""
      : `:${String(
          minutes
        ).padStart(
          2,
          "0"
        )}`;

  return `${displayHour}${displayMinutes} ${period}`;
}

function looksLikePhoneNumber(
  raw: string
): boolean {
  const digitsOnly =
    raw.replace(
      /\D/g,
      ""
    );

  return (
    digitsOnly.length >=
      9 &&
    digitsOnly.length <=
      15
  );
}

/* ============================================================
 * Odoo availability
 * ========================================================== */

async function getBookableSlots(
  date: string,
  partySize: number
): Promise<string[]> {
  if (
    !Number.isInteger(
      partySize
    ) ||
    partySize <
      1 ||
    partySize >
      4
  ) {
    return [];
  }

  return getBookableReservationTimes(
    date,
    partySize
  );
}

/* ============================================================
 * Main entry point
 * ========================================================== */

export async function processFlowMessage({
  text,

  buttonId,

  state,

  channel =
    "website",

  customerContact,
}: {
  text:
    string;

  buttonId?:
    string;

  state:
    FlowState;

  channel?:
    | "website"
    | "whatsapp";

  customerContact?:
    string;
}): Promise<FlowResult> {
  const input =
    (
      buttonId ??
      text
    ).trim();

  if (
    state.step !==
      "MAIN_MENU" &&
    isGlobalReset(
      text
    )
  ) {
    return {
      reply:
        MAIN_MENU_TEXT,

      state:
        INITIAL_STATE,

      buttons:
        MAIN_MENU_BUTTONS,
    };
  }

  switch (
    state.step
  ) {
    case "MAIN_MENU":
      return handleMainMenu(
        input
      );

    case "RESERVATION_MENU":
      return handleReservationMenu(
        input
      );

    case "ENQUIRY_MENU":
      return handleEnquiryMenu(
        input
      );

    case "ENQUIRY_HANDOFF_MESSAGE":
      return handleEnquiryHandoffMessage(
        input,
        state,
        channel,
        customerContact
      );

    case "ENQUIRY_HANDOFF_CONTACT":
      return handleEnquiryHandoffContact(
        input,
        state,
        channel
      );

    case "RESERVATION_PARTY_SIZE":
      return handleReservationPartySize(
        input,
        state,
        channel,
        customerContact
      );

    case "RESERVATION_DATE":
      return handleReservationDate(
        input,
        state,
        channel
      );

    case "RESERVATION_TIME":
      return handleReservationTime(
        input,
        state
      );

    case "RESERVATION_NAME":
      return handleReservationName(
        input,
        state
      );

    case "RESERVATION_PHONE":
      return handleReservationPhone(
        input,
        state
      );

    case "RESERVATION_CONFIRM":
      return handleReservationConfirm(
        input,
        state,
        channel
      );

    case "MANAGE_CODE":
      return handleManageCode(
        input,
        state
      );

    case "MANAGE_ACTION":
      return handleManageAction(
        input,
        state
      );

    case "MANAGE_MODIFY_DATE":
      return handleManageModifyDate(
        input,
        state,
        channel
      );

    case "MANAGE_MODIFY_TIME":
      return handleManageModifyTime(
        input,
        state,
        channel
      );

    default:
      return {
        reply:
          MAIN_MENU_TEXT,

        state:
          INITIAL_STATE,

        buttons:
          MAIN_MENU_BUTTONS,
      };
  }
}

/* ============================================================
 * Main menu handler
 * ========================================================== */

function handleMainMenu(
  input: string
): FlowResult {
  const normalized =
    input
      .trim()
      .toLowerCase();

  if (
    normalized ===
      "menu_reservation" ||
    normalized.includes(
      "reserv"
    )
  ) {
    return {
      reply:
        RESERVATION_MENU_TEXT,

      state: {
        step:
          "RESERVATION_MENU",

        draft:
          {},
      },

      buttons:
        withWhatsAppAgent(
          RESERVATION_MENU_BUTTONS
        ),
    };
  }

  if (
    normalized ===
      "menu_enquiries" ||
    normalized.includes(
      "enquir"
    )
  ) {
    return {
      reply:
        "What would you like to know?",

      state: {
        step:
          "ENQUIRY_MENU",

        draft:
          {},
      },

      buttons:
        ENQUIRY_MENU_BUTTONS,
    };
  }

  if (
    normalized ===
    "menu_menu"
  ) {
    return {
      reply:
        MENU_TEXT,

      state:
        INITIAL_STATE,

      buttons:
        MAIN_MENU_BUTTONS,
    };
  }

  return {
    reply:
      MAIN_MENU_TEXT,

    state:
      INITIAL_STATE,

    buttons:
      MAIN_MENU_BUTTONS,
  };
}

/* ============================================================
 * Reservation menu handler
 * ========================================================== */

function handleReservationMenu(
  input: string
): FlowResult {
  const normalized =
    input
      .trim()
      .toLowerCase();

  if (
    normalized ===
      "new" ||
    normalized.includes(
      "new"
    )
  ) {
    return {
      reply:
        "How many guests?",

      state: {
        step:
          "RESERVATION_PARTY_SIZE",

        draft:
          {},
      },

      buttons:
        withWhatsAppAgent(
          PARTY_SIZE_BUTTONS
        ),
    };
  }

  if (
    normalized ===
      "manage" ||
    normalized.includes(
      "manage"
    ) ||
    normalized.includes(
      "existing"
    )
  ) {
    return {
      reply:
        "Please enter your reservation code, or the phone number you booked with.",

      state: {
        step:
          "MANAGE_CODE",

        draft:
          {},
      },

      buttons:
        withWhatsAppAgent(),
    };
  }

  return {
    reply:
      RESERVATION_MENU_TEXT,

    state: {
      step:
        "RESERVATION_MENU",

      draft:
        {},
    },

    buttons:
      withWhatsAppAgent(
        RESERVATION_MENU_BUTTONS
      ),
  };
}

/* ============================================================
 * Party size
 * ========================================================== */

async function handleReservationPartySize(
  input: string,

  state:
    FlowState,

  channel:
    | "website"
    | "whatsapp",

  customerContact:
    | string
    | undefined
): Promise<FlowResult> {
  const normalized =
    input.trim();

  const numericPartySize =
    Number.parseInt(
      normalized,
      10
    );

  /**
   * 5+ goes to an agent.
   */
  if (
    normalized ===
      "5+" ||
    (
      Number.isFinite(
        numericPartySize
      ) &&
      numericPartySize >=
        5
    )
  ) {
    if (
      channel ===
        "whatsapp" &&
      customerContact
    ) {
      const result =
        await notifyStaffOfHandoff({
          message:
            "Customer wants to book a table for 5 or more guests.",

          channel,

          customerContact,
        });

      return {
        reply:
          result.success
            ? "For parties of 5 or more, our team will reply to you here shortly to arrange the best setup."
            : "For parties of 5 or more, please contact our team directly and we'll help arrange the best setup.",

        state:
          INITIAL_STATE,

        buttons:
          MAIN_MENU_BUTTONS,
      };
    }

    const whatsappNumber =
      siteConfig.whatsappNumber.replace(
        /\D/g,
        ""
      );

    const message =
      encodeURIComponent(
        "Hi, I'd like to book a table for 5 or more guests."
      );

    const url =
      `https://wa.me/${whatsappNumber}?text=${message}`;

    return {
      reply:
        "For parties of 5 or more, our team will help arrange the best table setup.",

      state:
        INITIAL_STATE,

      buttons: [
        {
          id:
            "open_whatsapp",

          title:
            "Talk to an agent on WhatsApp",

          url,
        },
      ],
    };
  }

  const partySize =
    numericPartySize;

  if (
    ![
      1,
      2,
      3,
      4,
    ].includes(
      partySize
    )
  ) {
    return {
      reply:
        "Please choose a party size below.",

      state,

      buttons:
        withWhatsAppAgent(
          PARTY_SIZE_BUTTONS
        ),
    };
  }

  const dateHint =
    channel ===
    "whatsapp"
      ? "What date would you like to book? (e.g. 'tomorrow', '12th September', or YYYY-MM-DD)"
      : "What date would you like to book?";

  return {
    reply:
      dateHint,

    state: {
      step:
        "RESERVATION_DATE",

      draft: {
        ...state.draft,

        partySize,
      },
    },

    inputType:
      "date",

    buttons:
      withWhatsAppAgent(),
  };
}

/* ============================================================
 * Reservation date
 * ========================================================== */

async function handleReservationDate(
  input: string,

  state:
    FlowState,

  channel:
    | "website"
    | "whatsapp"
): Promise<FlowResult> {
  const date =
    parseDateInput(
      input
    );

  const todayISO =
    getLagosTodayISO();

  if (
    !date
  ) {
    return {
      reply:
        channel ===
        "whatsapp"
          ? "Sorry, I couldn't understand that date. Try 'tomorrow', '12th September', or YYYY-MM-DD."
          : "Please choose a valid date.",

      state,

      inputType:
        "date",

      buttons:
        withWhatsAppAgent(),
    };
  }

  if (
    date <
    todayISO
  ) {
    return {
      reply:
        "That date is in the past — please choose today or later.",

      state,

      inputType:
        "date",

      buttons:
        withWhatsAppAgent(),
    };
  }

  const {
    partySize,
  } =
    state.draft;

  if (
    !partySize
  ) {
    return {
      reply:
        "Something went wrong — let's start over.",

      state:
        INITIAL_STATE,

      buttons:
        MAIN_MENU_BUTTONS,
    };
  }

  const bookableSlots =
    await getBookableSlots(
      date,
      partySize
    );

  if (
    bookableSlots.length ===
    0
  ) {
    return {
      reply:
        `Sorry, we're fully booked on ${date} for ${partySize} guests. Please choose another date.`,

      state: {
        step:
          "RESERVATION_DATE",

        draft:
          state.draft,
      },

      inputType:
        "date",

      buttons:
        withWhatsAppAgent(),
    };
  }

  return {
    reply:
      `Here's what's available on ${date}:`,

    state: {
      step:
        "RESERVATION_TIME",

      draft: {
        ...state.draft,

        date,
      },

      alternatives:
        bookableSlots,
    },

    buttons:
      withWhatsAppAgent(
        bookableSlots.map(
          (
            time
          ) => ({
            id:
              time,

            title:
              formatDisplayTime(
                time
              ),
          })
        )
      ),
  };
}

/* ============================================================
 * Reservation time
 * ========================================================== */

function handleReservationTime(
  input: string,

  state:
    FlowState
): FlowResult {
  const time =
    input.trim();

  const options =
    state.alternatives ??
    [];

  if (
    !options.includes(
      time
    )
  ) {
    return {
      reply:
        "Please choose one of the available times below.",

      state,

      buttons:
        withWhatsAppAgent(
          options.map(
            (
              option
            ) => ({
              id:
                option,

              title:
                formatDisplayTime(
                  option
                ),
            })
          )
        ),
    };
  }

  return {
    reply:
      "What name should the reservation be under?",

    state: {
      step:
        "RESERVATION_NAME",

      draft: {
        ...state.draft,

        time,
      },
    },

    buttons:
      withWhatsAppAgent(),
  };
}

/* ============================================================
 * Reservation name
 * ========================================================== */

function handleReservationName(
  input: string,

  state:
    FlowState
): FlowResult {
  const name =
    input.trim();

  if (
    !name
  ) {
    return {
      reply:
        "Sorry, I didn't catch that — what name should the reservation be under?",

      state,

      buttons:
        withWhatsAppAgent(),
    };
  }

  return {
    reply:
      `Thanks, ${name}! What's the best phone number to reach you on for this booking?`,

    state: {
      step:
        "RESERVATION_PHONE",

      draft: {
        ...state.draft,

        name,
      },
    },

    buttons:
      withWhatsAppAgent(),
  };
}

/* ============================================================
 * Reservation phone
 * ========================================================== */

function handleReservationPhone(
  input: string,

  state:
    FlowState
): FlowResult {
  const phone =
    input.trim();

  if (
    phone.replace(
      /\D/g,
      ""
    ).length <
    9
  ) {
    return {
      reply:
        "Please enter a valid phone number (e.g. 08012345678).",

      state,

      buttons:
        withWhatsAppAgent(),
    };
  }

  const draft = {
    ...state.draft,

    phone,
  };

  const {
    name,
    partySize,
    date,
    time,
  } =
    draft;

  return {
    reply:
      "Please confirm your booking:",

    state: {
      step:
        "RESERVATION_CONFIRM",

      draft,
    },

    summary: [
      {
        label:
          "Name",

        value:
          name ??
          "",
      },

      {
        label:
          "Party size",

        value:
          String(
            partySize ??
              ""
          ),
      },

      {
        label:
          "Date",

        value:
          date ??
          "",
      },

      {
        label:
          "Time",

        value:
          time
            ? formatDisplayTime(
                time
              )
            : "",
      },

      {
        label:
          "Phone",

        value:
          phone,
      },
    ],

    buttons:
      withWhatsAppAgent([
        {
          id:
            "confirm",

          title:
            "Confirm",
        },

        {
          id:
            "cancel",

          title:
            "Cancel",
        },
      ]),
  };
}

/* ============================================================
 * Reservation confirmation
 * ========================================================== */

async function handleReservationConfirm(
  input: string,

  state:
    FlowState,

  channel:
    | "website"
    | "whatsapp"
): Promise<FlowResult> {
  const normalized =
    input
      .trim()
      .toLowerCase();

  if (
    normalized ===
      "cancel" ||
    normalized ===
      "no"
  ) {
    return {
      reply:
        "No problem, your booking was cancelled.",

      state:
        INITIAL_STATE,

      buttons:
        MAIN_MENU_BUTTONS,
    };
  }

  if (
    normalized !==
      "confirm" &&
    normalized !==
      "yes"
  ) {
    return {
      reply:
        "Please confirm or cancel.",

      state,

      buttons:
        withWhatsAppAgent([
          {
            id:
              "confirm",

            title:
              "Confirm",
          },

          {
            id:
              "cancel",

            title:
              "Cancel",
          },
        ]),
    };
  }

  const {
    name,
    partySize,
    date,
    time,
    phone,
  } =
    state.draft;

  if (
    !name ||
    !partySize ||
    !date ||
    !time ||
    !phone
  ) {
    return {
      reply:
        "Something went wrong with your booking details — let's start over.",

      state:
        INITIAL_STATE,

      buttons:
        MAIN_MENU_BUTTONS,
    };
  }

  /**
   * Fresh Odoo allocation happens here.
   */
  const result =
    await createOdooReservation({
      name,

      phone,

      partySize,

      date,

      time,
    });

  if (
    result.success
  ) {
    sendReservationConfirmations({
      name,

      phone,

      partySize,

      date,

      time,

      reservationCode:
        result.reservationCode,

      originChannel:
        channel,
    }).catch(
      (
        error
      ) => {
        console.error(
          "Reservation confirmation send failed:",
          error
        );
      }
    );

    const codeLine =
      result.reservationCode
        ? `\n\nYour reservation code is ${result.reservationCode} — keep it handy if you need to change or cancel later.`
        : "";

    return {
      reply:
        `You're booked! Reservation confirmed for ${name}, party of ${partySize}, on ${date} at ${formatDisplayTime(
          time
        )}.${codeLine}`,

      state:
        INITIAL_STATE,

      buttons:
        MAIN_MENU_BUTTONS,
    };
  }

  /**
   * Re-read Odoo because another customer may have
   * claimed that table before Confirm was pressed.
   */
  const bookableSlots =
    await getBookableSlots(
      date,
      partySize
    );

  if (
    bookableSlots.length ===
    0
  ) {
    return {
      reply:
        `Sorry, that time just became unavailable and there's nothing else open on ${date}. Please choose another date.`,

      state: {
        step:
          "RESERVATION_DATE",

        draft: {
          partySize,
        },
      },

      inputType:
        "date",

      buttons:
        withWhatsAppAgent(),
    };
  }

  return {
    reply:
      `Sorry, that time just became unavailable. Here's what's still open on ${date}:`,

    state: {
      step:
        "RESERVATION_TIME",

      draft: {
        partySize,

        date,
      },

      alternatives:
        bookableSlots,
    },

    buttons:
      withWhatsAppAgent(
        bookableSlots.map(
          (
            option
          ) => ({
            id:
              option,

            title:
              formatDisplayTime(
                option
              ),
          })
        )
      ),
  };
}

/* ============================================================
 * Manage existing reservation
 * ========================================================== */

async function handleManageCode(
  input: string,

  state:
    FlowState
): Promise<FlowResult> {
  const raw =
    input.trim();

  if (
    raw.length <
    4
  ) {
    return {
      reply:
        "Please enter your reservation code, or the phone number you booked with.",

      state,

      buttons:
        withWhatsAppAgent(),
    };
  }

  /**
   * Lookup using phone.
   */
  if (
    looksLikePhoneNumber(
      raw
    )
  ) {
    const result =
      await getOdooReservationByPhone(
        raw
      );

    if (
      !result.success
    ) {
      return {
        reply:
          result.error ??
          "I couldn't find a reservation with that phone number.",

        state,

        buttons:
          withWhatsAppAgent(),
      };
    }

    return showManageSummary(
      result,
      result.reservationCode
    );
  }

  /**
   * Lookup using reservation code.
   */
  const code =
    raw.toUpperCase();

  const result =
    await getOdooReservationByCode(
      code
    );

  if (
    !result.success
  ) {
    return {
      reply:
        "I couldn't find a reservation with that code. Please double-check it and try again.",

      state,

      buttons:
        withWhatsAppAgent(),
    };
  }

  return showManageSummary(
    result,
    code
  );
}

/* ============================================================
 * Reservation summary
 * ========================================================== */

function showManageSummary(
  result: {
    success:
      boolean;

    name?:
      string;

    phone?:
      string;

    partySize?:
      number;

    date?:
      string;

    time?:
      string;

    status?:
      string;

    reservationCode?:
      string;
  },

  code?:
    string
): FlowResult {
  if (
    !code
  ) {
    return {
      reply:
        "I found the reservation, but its reservation code is missing. Please contact our team.",

      state:
        INITIAL_STATE,

      buttons:
        withWhatsAppAgent(
          MAIN_MENU_BUTTONS
        ),
    };
  }

  const displayTime =
    result.time
      ? formatDisplayTime(
          result.time.slice(
            0,
            5
          )
        )
      : "";

  if (
    result.status ===
    "cancelled"
  ) {
    return {
      reply:
        "This reservation has already been cancelled.",

      state:
        INITIAL_STATE,

      buttons:
        MAIN_MENU_BUTTONS,

      summary: [
        {
          label:
            "Name",

          value:
            result.name ??
            "",
        },

        {
          label:
            "Party size",

          value:
            String(
              result.partySize ??
                ""
            ),
        },

        {
          label:
            "Date",

          value:
            result.date ??
            "",
        },

        {
          label:
            "Time",

          value:
            displayTime,
        },

        {
          label:
            "Status",

          value:
            result.status ??
            "",
        },
      ],
    };
  }

  return {
    reply:
      "Here are your reservation details:",

    state: {
      step:
        "MANAGE_ACTION",

      draft:
        {},

      manageCode:
        code,

      managePartySize:
        result.partySize,

      manageName:
        result.name,

      managePhone:
        result.phone,
    },

    summary: [
      {
        label:
          "Name",

        value:
          result.name ??
          "",
      },

      {
        label:
          "Party size",

        value:
          String(
            result.partySize ??
              ""
          ),
      },

      {
        label:
          "Date",

        value:
          result.date ??
          "",
      },

      {
        label:
          "Time",

        value:
          displayTime,
      },

      {
        label:
          "Status",

        value:
          result.status ??
          "confirmed",
      },
    ],

    buttons:
      withWhatsAppAgent([
        {
          id:
            "1",

          title:
            "Cancel reservation",
        },

        {
          id:
            "2",

          title:
            "Change date/time",
        },

        {
          id:
            "3",

          title:
            "Back to main menu",
        },
      ]),
  };
}

/* ============================================================
 * Manage action
 * ========================================================== */

async function handleManageAction(
  input: string,

  state:
    FlowState
): Promise<FlowResult> {
  const normalized =
    input
      .trim()
      .toLowerCase();

  const code =
    state.manageCode;

  if (
    !code
  ) {
    return {
      reply:
        MAIN_MENU_TEXT,

      state:
        INITIAL_STATE,

      buttons:
        MAIN_MENU_BUTTONS,
    };
  }

  /**
   * Cancel reservation.
   */
  if (
    normalized ===
      "1" ||
    normalized.includes(
      "cancel"
    )
  ) {
    const result =
      await cancelOdooReservation(
        code
      );

    return {
      reply:
        result.success
          ? "Your reservation has been cancelled. We hope to see you another time!"
          : `Sorry, something went wrong cancelling that reservation (${result.error ?? "unknown error"}). Please talk to our team.`,

      state:
        INITIAL_STATE,

      buttons:
        result.success
          ? MAIN_MENU_BUTTONS
          : withWhatsAppAgent(
              MAIN_MENU_BUTTONS
            ),
    };
  }

  /**
   * Modify reservation.
   */
  if (
    normalized ===
      "2" ||
    normalized.includes(
      "change"
    ) ||
    normalized.includes(
      "modify"
    )
  ) {
    return {
      reply:
        "What date would you like to move it to?",

      state: {
        step:
          "MANAGE_MODIFY_DATE",

        draft:
          {},

        manageCode:
          code,

        managePartySize:
          state.managePartySize,

        manageName:
          state.manageName,

        managePhone:
          state.managePhone,
      },

      inputType:
        "date",

      buttons:
        withWhatsAppAgent(),
    };
  }

  if (
    normalized ===
    "3"
  ) {
    return {
      reply:
        MAIN_MENU_TEXT,

      state:
        INITIAL_STATE,

      buttons:
        MAIN_MENU_BUTTONS,
    };
  }

  return {
    reply:
      "Please choose an option below.",

    state,

    buttons:
      withWhatsAppAgent([
        {
          id:
            "1",

          title:
            "Cancel reservation",
        },

        {
          id:
            "2",

          title:
            "Change date/time",
        },

        {
          id:
            "3",

          title:
            "Back to main menu",
        },
      ]),
  };
}

/* ============================================================
 * Modify reservation date
 * ========================================================== */

async function handleManageModifyDate(
  input: string,

  state:
    FlowState,

  channel:
    | "website"
    | "whatsapp"
): Promise<FlowResult> {
  const date =
    parseDateInput(
      input
    );

  const todayISO =
    getLagosTodayISO();

  if (
    !date
  ) {
    return {
      reply:
        channel ===
        "whatsapp"
          ? "Sorry, I couldn't understand that date. Try 'tomorrow', '12th September', or YYYY-MM-DD."
          : "Please choose a valid date.",

      state,

      inputType:
        "date",

      buttons:
        withWhatsAppAgent(),
    };
  }

  if (
    date <
    todayISO
  ) {
    return {
      reply:
        "That date is in the past — please choose today or later.",

      state,

      inputType:
        "date",

      buttons:
        withWhatsAppAgent(),
    };
  }

  const partySize =
    state.managePartySize ??
    1;

  /**
   * Larger reservations remain agent-managed.
   */
  if (
    partySize >
    4
  ) {
    return {
      reply:
        "Please contact our team to change this reservation.",

      state:
        INITIAL_STATE,

      buttons:
        withWhatsAppAgent(
          MAIN_MENU_BUTTONS
        ),
    };
  }

  const bookableSlots =
    await getBookableSlots(
      date,
      partySize
    );

  if (
    bookableSlots.length ===
    0
  ) {
    return {
      reply:
        `Sorry, we're fully booked on ${date} for ${partySize} guests. Please choose another date.`,

      state,

      inputType:
        "date",

      buttons:
        withWhatsAppAgent(),
    };
  }

  return {
    reply:
      `Here's what's available on ${date}:`,

    state: {
      step:
        "MANAGE_MODIFY_TIME",

      draft: {
        date,
      },

      manageCode:
        state.manageCode,

      managePartySize:
        partySize,

      manageName:
        state.manageName,

      managePhone:
        state.managePhone,

      alternatives:
        bookableSlots,
    },

    buttons:
      withWhatsAppAgent(
        bookableSlots.map(
          (
            option
          ) => ({
            id:
              option,

            title:
              formatDisplayTime(
                option
              ),
          })
        )
      ),
  };
}

/* ============================================================
 * Modify reservation time
 * ========================================================== */

async function handleManageModifyTime(
  input: string,

  state:
    FlowState,

  channel:
    | "website"
    | "whatsapp"
): Promise<FlowResult> {
  const time =
    input.trim();

  const {
    date,
  } =
    state.draft;

  const code =
    state.manageCode;

  const partySize =
    state.managePartySize ??
    1;

  const options =
    state.alternatives ??
    [];

  if (
    !options.includes(
      time
    )
  ) {
    return {
      reply:
        "Please choose one of the available times below.",

      state,

      buttons:
        withWhatsAppAgent(
          options.map(
            (
              option
            ) => ({
              id:
                option,

              title:
                formatDisplayTime(
                  option
                ),
            })
          )
        ),
    };
  }

  if (
    !date ||
    !code
  ) {
    return {
      reply:
        "Something went wrong — let's start over.",

      state:
        INITIAL_STATE,

      buttons:
        MAIN_MENU_BUTTONS,
    };
  }

  /**
   * Odoo:
   *
   * secure new allocation
   * release old allocation
   */
  const result =
    await modifyOdooReservation(
      code,
      date,
      time
    );

  if (
    result.success
  ) {
    /**
     * Send WhatsApp update confirmation.
     *
     * Website edits use the approved reservation_updated
     * template.
     *
     * WhatsApp edits use a normal message while the
     * conversation is active.
     */
    if (
      state.manageName &&
      state.managePhone
    ) {
      sendReservationUpdateConfirmation({
        name:
          state.manageName,

        phone:
          state.managePhone,

        partySize,

        date,

        time,

        reservationCode:
          code,

        originChannel:
          channel,
      }).catch(
        (
          error
        ) => {
          console.error(
            "Reservation update confirmation failed:",
            error
          );
        }
      );
    }

    return {
      reply:
        `Done! Your reservation has been moved to ${date} at ${formatDisplayTime(
          time
        )}.`,

      state:
        INITIAL_STATE,

      buttons:
        MAIN_MENU_BUTTONS,
    };
  }

  /**
   * The new allocation disappeared between selection
   * and confirmation.
   */
  const refreshedSlots =
    await getBookableSlots(
      date,
      partySize
    );

  if (
    refreshedSlots.length ===
    0
  ) {
    return {
      reply:
        `Sorry, that time just became unavailable and there's nothing else open on ${date}. Please choose another date.`,

      state: {
        step:
          "MANAGE_MODIFY_DATE",

        draft:
          {},

        manageCode:
          code,

        managePartySize:
          partySize,

        manageName:
          state.manageName,

        managePhone:
          state.managePhone,
      },

      inputType:
        "date",

      buttons:
        withWhatsAppAgent(),
    };
  }

  return {
    reply:
      `Sorry, that time just became unavailable. Here's what's still open on ${date}:`,

    state: {
      step:
        "MANAGE_MODIFY_TIME",

      draft: {
        date,
      },

      manageCode:
        code,

      managePartySize:
        partySize,

      manageName:
        state.manageName,

      managePhone:
        state.managePhone,

      alternatives:
        refreshedSlots,
    },

    buttons:
      withWhatsAppAgent(
        refreshedSlots.map(
          (
            option
          ) => ({
            id:
              option,

            title:
              formatDisplayTime(
                option
              ),
          })
        )
      ),
  };
}

/* ============================================================
 * Enquiry menu
 * ========================================================== */

function handleEnquiryMenu(
  input: string
): FlowResult {
  const normalized =
    input
      .trim()
      .toLowerCase();

  const topicByNumber:
    Record<
      string,
      EnquiryTopicKey
    > = {
    "1":
      "hours",

    "2":
      "location",

    "3":
      "takeaway",

    "4":
      "contact",
  };

  const topicKey =
    topicByNumber[
      normalized
    ];

  if (
    topicKey
  ) {
    const topic =
      ENQUIRY_TOPICS[
        topicKey
      ];

    return {
      reply:
        `${topic.label}\n\n${topic.text}`,

      state: {
        step:
          "ENQUIRY_MENU",

        draft:
          {},
      },

      buttons:
        ENQUIRY_MENU_BUTTONS,
    };
  }

  if (
    normalized ===
      "5" ||
    normalized.includes(
      "team"
    ) ||
    normalized.includes(
      "agent"
    )
  ) {
    return {
      reply:
        "Sure — what would you like to ask our team? Type your question and we'll get back to you shortly.",

      state: {
        step:
          "ENQUIRY_HANDOFF_MESSAGE",

        draft:
          {},
      },
    };
  }

  return {
    reply:
      "What would you like to know?",

    state: {
      step:
        "ENQUIRY_MENU",

      draft:
        {},
    },

    buttons:
      ENQUIRY_MENU_BUTTONS,
  };
}

/* ============================================================
 * Enquiry handoff
 * ========================================================== */

async function handleEnquiryHandoffMessage(
  input: string,

  state:
    FlowState,

  channel:
    | "website"
    | "whatsapp",

  customerContact:
    | string
    | undefined
): Promise<FlowResult> {
  const message =
    input.trim();

  if (
    !message
  ) {
    return {
      reply:
        "Sorry, I didn't catch that — what would you like to ask our team?",

      state,
    };
  }

  /**
   * WhatsApp already gives us a customer number.
   */
  if (
    channel ===
      "whatsapp" &&
    customerContact
  ) {
    try {
      await createHelpdeskTicket({
        customerName:
          customerContact,

        whatsappNumber:
          customerContact,

        message,
      });

      return {
        reply:
          "Thanks — I've passed your message to our team, and someone will reply to you shortly.",

        state:
          INITIAL_STATE,

        buttons:
          MAIN_MENU_BUTTONS,
      };
    } catch (
      error
    ) {
      console.error(
        "Failed to create Odoo ticket:",
        error
      );

      return {
        reply:
          "We're having a small issue reaching the team right now. Please try again shortly or contact us directly.",

        state:
          INITIAL_STATE,

        buttons:
          MAIN_MENU_BUTTONS,
      };
    }
  }

  /**
   * Website doesn't already give us the customer's
   * WhatsApp/contact identity.
   */
  return {
    reply:
      "Got it. What's the best phone number or email to reach you back on?",

    state: {
      step:
        "ENQUIRY_HANDOFF_CONTACT",

      draft:
        {},

      handoffMessage:
        message,
    },
  };
}

async function handleEnquiryHandoffContact(
  input: string,

  state:
    FlowState,

  channel:
    | "website"
    | "whatsapp"
): Promise<FlowResult> {
  const contact =
    input.trim();

  if (
    contact.length <
    5
  ) {
    return {
      reply:
        "Please share a valid phone number or email so our team can reach you.",

      state,
    };
  }

  const message =
    state.handoffMessage ??
    "(no message provided)";

  const result =
    await notifyStaffOfHandoff({
      message,

      channel,

      customerContact:
        contact,
    });

  return {
    reply:
      result.success
        ? "Thanks — I've passed your message to our team, and they'll reach out to you shortly."
        : "We're having a small issue notifying the team right now. Please try again shortly.",

    state:
      INITIAL_STATE,

    buttons:
      MAIN_MENU_BUTTONS,
  };
}