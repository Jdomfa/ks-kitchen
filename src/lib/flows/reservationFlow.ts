import { checkAvailability } from '@/lib/reservations/availability';
import {
  createReservation,
  getReservationByCode,
  cancelReservationByCode,
  modifyReservationByCode,
} from '@/lib/reservations/tools';
import { sendReservationConfirmations } from '@/lib/notifications/confirmation';
import { notifyStaffOfHandoff } from '@/lib/notifications/handoff';
import { siteConfig } from '@/lib/site-config.ts';

export type FlowStep =
  | 'MAIN_MENU'
  | 'RESERVATION_MENU'
  | 'ENQUIRY_MENU'
  | 'ENQUIRY_HANDOFF_MESSAGE'
  | 'ENQUIRY_HANDOFF_CONTACT'
  | 'RESERVATION_NAME'
  | 'RESERVATION_PARTY_SIZE'
  | 'RESERVATION_DATE'
  | 'RESERVATION_TIME'
  | 'RESERVATION_ALTERNATIVE'
  | 'RESERVATION_EMAIL'
  | 'RESERVATION_CONFIRM'
  | 'MANAGE_CODE'
  | 'MANAGE_ACTION'
  | 'MANAGE_MODIFY_DATE'
  | 'MANAGE_MODIFY_TIME';

export type ReservationDraft = {
  name?: string;
  partySize?: number;
  date?: string;
  time?: string;
  email?: string;
  phone?: string;
};

export type FlowState = {
  step: FlowStep;
  draft: ReservationDraft;
  alternatives?: string[];
  handoffMessage?: string;
  manageCode?: string;
};

export const INITIAL_STATE: FlowState = {
  step: 'MAIN_MENU',
  draft: {},
};

export type FlowButton = { id: string; title: string };

export type FlowResult = {
  reply: string;
  state: FlowState;
  buttons?: FlowButton[];
};

const MENU_TEXT = `
Our full menu: TODO — add menu link or list here.
`.trim();

const MAIN_MENU_TEXT =
  "Welcome to K's Kitchen! How can I help?\n\n1. Reservations\n2. Enquiries\n3. Menu\n\nReply with a number.";

const MAIN_MENU_BUTTONS: FlowButton[] = [
  { id: 'menu_reservation', title: 'Reservations' },
  { id: 'menu_enquiries', title: 'Enquiries' },
  { id: 'menu_menu', title: 'Menu' },
];

const RESERVATION_MENU_TEXT =
  '1. Make a new reservation\n2. Manage an existing reservation\n\nReply with a number, or 0 for the main menu.';

// ---------------------------------------------------------
// Enquiry content — sourced from siteConfig where possible.
// ---------------------------------------------------------

const ENQUIRY_TOPICS = {
  hours: {
    label: 'Opening Hours',
    text: siteConfig.hours.map((h) => `${h.days}: ${h.time}`).join('\n'),
  },
  location: {
    label: 'Location',
    text: `${siteConfig.address.line1}, ${siteConfig.address.line2}\nDine-in available via reservation or walk-in.\n${siteConfig.address.map}`,
  },
  takeaway: {
    label: 'Takeaway & Delivery',
    text: `Takeaway: TODO — confirm yes/no and any conditions.\nDelivery: TODO — confirm which platforms (e.g. Chowdeck, Glovo) or in-house.\nOrders: ${siteConfig.orderEmail}`,
  },
  contact: {
    label: 'Contact & Parking',
    text: `Phone: ${siteConfig.reservationPhone}\nEmail: ${siteConfig.reservationEmail}\nParking: TODO — confirm availability.`,
  },
} as const;

type EnquiryTopicKey = keyof typeof ENQUIRY_TOPICS;

const ENQUIRY_MENU_TEXT = [
  'What would you like to know?',
  '',
  '1. Opening Hours',
  '2. Location',
  '3. Takeaway & Delivery',
  '4. Contact & Parking',
  '5. Talk to our team',
  '',
  'Reply with a number, or 0 for the main menu.',
].join('\n');

function handleEnquiryMenu(input: string): FlowResult {
  const normalized = input.trim().toLowerCase();

  const topicByNumber: Record<string, EnquiryTopicKey> = {
    '1': 'hours',
    '2': 'location',
    '3': 'takeaway',
    '4': 'contact',
  };

  const topicKey = topicByNumber[normalized];

  if (topicKey) {
    const topic = ENQUIRY_TOPICS[topicKey];
    return {
      reply: `${topic.label}\n\n${topic.text}\n\n---\n${ENQUIRY_MENU_TEXT}`,
      state: { step: 'ENQUIRY_MENU', draft: {} },
    };
  }

  if (normalized === '5' || normalized.includes('team') || normalized.includes('agent')) {
    return {
      reply: "Sure — what would you like to ask our team? Type your question and we'll get back to you shortly.",
      state: { step: 'ENQUIRY_HANDOFF_MESSAGE', draft: {} },
    };
  }

  return {
    reply: ENQUIRY_MENU_TEXT,
    state: { step: 'ENQUIRY_MENU', draft: {} },
  };
}

async function handleEnquiryHandoffMessage(
  input: string,
  state: FlowState,
  channel: 'website' | 'whatsapp',
  customerContact: string | undefined
): Promise<FlowResult> {
  const message = input.trim();

  if (!message) {
    return {
      reply: "Sorry, I didn't catch that — what would you like to ask our team?",
      state,
    };
  }

  if (channel === 'whatsapp' && customerContact) {
    const result = await notifyStaffOfHandoff({ message, channel, customerContact });

    return {
      reply: result.success
        ? "Thanks — I've passed your message to our team, and they'll reach out to you on WhatsApp shortly."
        : "Thanks for your message — we're having a small hiccup notifying the team right now, but someone will follow up as soon as possible.",
      state: INITIAL_STATE,
    };
  }

  return {
    reply: "Got it. What's the best phone number or email to reach you back on?",
    state: { step: 'ENQUIRY_HANDOFF_CONTACT', draft: {}, handoffMessage: message },
  };
}

async function handleEnquiryHandoffContact(
  input: string,
  state: FlowState,
  channel: 'website' | 'whatsapp'
): Promise<FlowResult> {
  const contact = input.trim();

  if (contact.length < 5) {
    return {
      reply: 'Please share a valid phone number or email so our team can reach you.',
      state,
    };
  }

  const message = state.handoffMessage ?? '(no message provided)';

  const result = await notifyStaffOfHandoff({ message, channel, customerContact: contact });

  return {
    reply: result.success
      ? "Thanks — I've passed your message to our team, and they'll reach out to you shortly."
      : "Thanks for your message — we're having a small hiccup notifying the team right now, but someone will follow up as soon as possible.",
    state: INITIAL_STATE,
  };
}

// ---------------------------------------------------------
// Date/time parsing
// ---------------------------------------------------------

function getLagosTodayISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function buildDateISO(year: number, monthIndex: number, day: number): string | null {
  const d = new Date(Date.UTC(year, monthIndex, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== monthIndex ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return d.toISOString().slice(0, 10);
}

function parseDateInput(raw: string): string | null {
  const text = raw.trim().toLowerCase();
  const todayISO = getLagosTodayISO();

  if (text === 'today') return todayISO;

  if (text === 'tomorrow') {
    const d = new Date(`${todayISO}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const dmy = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return buildDateISO(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  }

  const currentYear = parseInt(todayISO.slice(0, 4), 10);

  const dayFirst = text.match(
    /^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\.?(?:\s+(\d{4}))?$/
  );
  if (dayFirst) {
    const [, dayStr, monthStr, yearStr] = dayFirst;
    const monthIndex = MONTH_NAMES[monthStr];
    if (monthIndex !== undefined) {
      const year = yearStr ? parseInt(yearStr, 10) : currentYear;
      let iso = buildDateISO(year, monthIndex, parseInt(dayStr, 10));
      if (iso && !yearStr && iso < todayISO) {
        iso = buildDateISO(year + 1, monthIndex, parseInt(dayStr, 10));
      }
      return iso;
    }
  }

  const monthFirst = text.match(
    /^([a-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?$/
  );
  if (monthFirst) {
    const [, monthStr, dayStr, yearStr] = monthFirst;
    const monthIndex = MONTH_NAMES[monthStr];
    if (monthIndex !== undefined) {
      const year = yearStr ? parseInt(yearStr, 10) : currentYear;
      let iso = buildDateISO(year, monthIndex, parseInt(dayStr, 10));
      if (iso && !yearStr && iso < todayISO) {
        iso = buildDateISO(year + 1, monthIndex, parseInt(dayStr, 10));
      }
      return iso;
    }
  }

  return null;
}

function parseTimeInput(raw: string): string | null {
  const text = raw.trim().toLowerCase();

  let match = text.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }

  match = text.match(/^(\d{1,2})(?::([0-5]\d))?\s*(am|pm)$/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2] ?? '00';
    const period = match[3];

    if (h < 1 || h > 12) return null;
    if (period === 'pm' && h !== 12) h += 12;
    if (period === 'am' && h === 12) h = 0;

    return `${String(h).padStart(2, '0')}:${m}`;
  }

  return null;
}

function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

function isGlobalReset(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t === '0' || t === 'menu' || t === 'restart' || t === 'back';
}

function formatDisplayTime(time: string): string {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`;
  return `${displayHour}${displayMinutes} ${period}`;
}

// ---------------------------------------------------------
// Main entry point
// ---------------------------------------------------------

export async function processFlowMessage({
  text,
  buttonId,
  state,
  channel = 'website',
  customerContact,
}: {
  text: string;
  buttonId?: string;
  state: FlowState;
  channel?: 'website' | 'whatsapp';
  customerContact?: string;
}): Promise<FlowResult> {
  const input = (buttonId ?? text).trim();

  if (state.step !== 'MAIN_MENU' && isGlobalReset(text)) {
    return {
      reply: MAIN_MENU_TEXT,
      state: INITIAL_STATE,
      buttons: MAIN_MENU_BUTTONS,
    };
  }

  switch (state.step) {
    case 'MAIN_MENU':
      return handleMainMenu(input);

    case 'RESERVATION_MENU':
      return handleReservationMenu(input);

    case 'ENQUIRY_MENU':
      return handleEnquiryMenu(input);

    case 'ENQUIRY_HANDOFF_MESSAGE':
      return handleEnquiryHandoffMessage(input, state, channel, customerContact);

    case 'ENQUIRY_HANDOFF_CONTACT':
      return handleEnquiryHandoffContact(input, state, channel);

    case 'RESERVATION_NAME':
      return handleReservationName(input, state);

    case 'RESERVATION_PARTY_SIZE':
      return handleReservationPartySize(input, state);

    case 'RESERVATION_DATE':
      return handleReservationDate(input, state);

    case 'RESERVATION_TIME':
      return handleReservationTime(input, state);

    case 'RESERVATION_ALTERNATIVE':
      return handleReservationAlternative(input, state);

    case 'RESERVATION_EMAIL':
      return handleReservationEmail(input, state);

    case 'RESERVATION_CONFIRM':
      return handleReservationConfirm(input, state, channel);

    case 'MANAGE_CODE':
      return handleManageCode(input, state);

    case 'MANAGE_ACTION':
      return handleManageAction(input, state);

    case 'MANAGE_MODIFY_DATE':
      return handleManageModifyDate(input, state);

    case 'MANAGE_MODIFY_TIME':
      return handleManageModifyTime(input, state);

    default:
      return {
        reply: MAIN_MENU_TEXT,
        state: INITIAL_STATE,
        buttons: MAIN_MENU_BUTTONS,
      };
  }
}

// ---------------------------------------------------------
// Step handlers
// ---------------------------------------------------------

function handleMainMenu(input: string): FlowResult {
  const normalized = input.toLowerCase();

  if (normalized === '1' || normalized === 'menu_reservation' || normalized.includes('reserv')) {
    return {
      reply: RESERVATION_MENU_TEXT,
      state: { step: 'RESERVATION_MENU', draft: {} },
    };
  }

  if (normalized === '2' || normalized === 'menu_enquiries' || normalized.includes('enquir')) {
    return {
      reply: ENQUIRY_MENU_TEXT,
      state: { step: 'ENQUIRY_MENU', draft: {} },
    };
  }

  if (normalized === '3' || normalized === 'menu_menu' || normalized === 'menu') {
    return {
      reply: `${MENU_TEXT}\n\n1. Reservations\n2. Enquiries\n3. Menu`,
      state: { step: 'MAIN_MENU', draft: {} },
      buttons: MAIN_MENU_BUTTONS,
    };
  }

  return {
    reply: MAIN_MENU_TEXT,
    state: { step: 'MAIN_MENU', draft: {} },
    buttons: MAIN_MENU_BUTTONS,
  };
}

function handleReservationMenu(input: string): FlowResult {
  const normalized = input.trim().toLowerCase();

  if (normalized === '1' || normalized.includes('new')) {
    return {
      reply: 'Great! What name should the reservation be under?',
      state: { step: 'RESERVATION_NAME', draft: {} },
    };
  }

  if (normalized === '2' || normalized.includes('manage') || normalized.includes('existing')) {
    return {
      reply: 'Please enter your reservation code (e.g. AB12CD).',
      state: { step: 'MANAGE_CODE', draft: {} },
    };
  }

  return {
    reply: RESERVATION_MENU_TEXT,
    state: { step: 'RESERVATION_MENU', draft: {} },
  };
}

function handleReservationName(input: string, state: FlowState): FlowResult {
  const name = input.trim();

  if (!name) {
    return {
      reply: "Sorry, I didn't catch that — what name should the reservation be under?",
      state,
    };
  }

  return {
    reply: `Thanks, ${name}. How many guests will be joining?`,
    state: { step: 'RESERVATION_PARTY_SIZE', draft: { ...state.draft, name } },
  };
}

function handleReservationPartySize(input: string, state: FlowState): FlowResult {
  const partySize = parseInt(input.trim(), 10);

  if (!Number.isFinite(partySize) || partySize <= 0) {
    return {
      reply: 'Please enter the number of guests as a number, e.g. 4.',
      state,
    };
  }

  if (partySize > 40) {
    return {
      reply:
        "That's a large group! For parties over 40, please talk to our team directly so we can arrange it properly. Reply 0 for the main menu, then choose Enquiries → Talk to our team.",
      state: INITIAL_STATE,
    };
  }

  return {
    reply: "What date would you like to book? (e.g. '12th September', 'tomorrow', or YYYY-MM-DD)",
    state: { step: 'RESERVATION_DATE', draft: { ...state.draft, partySize } },
  };
}

function handleReservationDate(input: string, state: FlowState): FlowResult {
  const date = parseDateInput(input);
  const todayISO = getLagosTodayISO();

  if (!date) {
    return {
      reply: "Sorry, I couldn't understand that date. Try '12th September', 'tomorrow', or YYYY-MM-DD.",
      state,
    };
  }

  if (date < todayISO) {
    return {
      reply: 'That date is in the past — could you give me a date from today onward?',
      state,
    };
  }

  return {
    reply: 'What time would you like to book? (e.g. 7pm or 19:00)',
    state: { step: 'RESERVATION_TIME', draft: { ...state.draft, date } },
  };
}

async function attemptBookTime(
  timeInput: string,
  state: FlowState
): Promise<FlowResult> {
  const time = parseTimeInput(timeInput);

  if (!time) {
    return {
      reply: "Sorry, I couldn't understand that time. Try something like 7pm or 19:00.",
      state,
    };
  }

  const { date, partySize } = state.draft;

  if (!date || !partySize) {
    return {
      reply: "Something went wrong with your booking details — let's start over.",
      state: INITIAL_STATE,
      buttons: MAIN_MENU_BUTTONS,
    };
  }

  const result = await checkAvailability({ date, time, partySize });

  if (result.available) {
    return {
      reply: "That time is available! What's the best email address for your booking confirmation?",
      state: {
        step: 'RESERVATION_EMAIL',
        draft: { ...state.draft, time },
      },
    };
  }

  if (result.alternatives.length > 0) {
    const displayed = result.alternatives.slice(0, 6);

    const list = displayed
      .map((alt, i) => `${i + 1}. ${alt.slice(0, 5)}`)
      .join('\n');

    return {
      reply: `Sorry, ${time} isn't available for ${partySize} guests. Here are some alternatives:\n\n${list}\n\nReply with a number, or type another time.`,
      state: {
        step: 'RESERVATION_ALTERNATIVE',
        draft: state.draft,
        alternatives: displayed,
      },
    };
  }

  return {
    reply: `Sorry, ${time} isn't available and I don't have any alternatives for that date. Could you try a different date?`,
    state: { step: 'RESERVATION_DATE', draft: state.draft },
  };
}

function handleReservationTime(input: string, state: FlowState): Promise<FlowResult> {
  return attemptBookTime(input, state);
}

function handleReservationAlternative(
  input: string,
  state: FlowState
): Promise<FlowResult> {
  const alternatives = state.alternatives ?? [];
  const choice = parseInt(input.trim(), 10);

  if (Number.isFinite(choice) && choice >= 1 && choice <= alternatives.length) {
    const chosen = alternatives[choice - 1].slice(0, 5);
    return attemptBookTime(chosen, { ...state, alternatives: undefined });
  }

  return attemptBookTime(input, { ...state, alternatives: undefined });
}

function handleReservationEmail(input: string, state: FlowState): FlowResult {
  const email = input.trim();

  if (!isValidEmail(email)) {
    return {
      reply: "That doesn't look like a valid email — could you try again? (e.g. name@example.com)",
      state,
    };
  }

  const draft = { ...state.draft, email };
  const { name, partySize, date, time } = draft;

  const summary = [
    `Name: ${name}`,
    `Party size: ${partySize}`,
    `Date: ${date}`,
    `Time: ${time}`,
    `Email: ${email}`,
  ].join('\n');

  return {
    reply: `Please confirm your booking:\n\n${summary}\n\n1. Confirm\n2. Cancel`,
    state: { step: 'RESERVATION_CONFIRM', draft },
  };
}

async function handleReservationConfirm(
  input: string,
  state: FlowState,
  channel: 'website' | 'whatsapp'
): Promise<FlowResult> {
  const normalized = input.trim().toLowerCase();

  if (normalized === '2' || normalized === 'cancel' || normalized === 'no') {
    return {
      reply: 'No problem, your booking was cancelled. Reply 0 for the main menu.',
      state: INITIAL_STATE,
    };
  }

  if (normalized === '1' || normalized === 'confirm' || normalized === 'yes') {
    const { name, partySize, date, time, email } = state.draft;

    if (!name || !partySize || !date || !time || !email) {
      return {
        reply: "Something went wrong with your booking details — let's start over.",
        state: INITIAL_STATE,
        buttons: MAIN_MENU_BUTTONS,
      };
    }

    const result = (await createReservation({
      name,
      email,
      party_size: partySize,
      date,
      time,
    })) as {
      success: boolean;
      reservation_id?: string;
      reservation_code?: string;
      error?: string;
      reason?: string;
    };

    if (result.success) {
      sendReservationConfirmations({
        name,
        email,
        phone: state.draft.phone,
        partySize,
        date,
        time,
        originChannel: channel,
      }).catch((error) => {
        console.error('Reservation confirmation send failed:', error);
      });

      const codeLine = result.reservation_code
        ? `\n\nYour reservation code is ${result.reservation_code} — keep it handy if you need to change or cancel later.`
        : '';

      return {
        reply: `You're booked! Reservation confirmed for ${name}, party of ${partySize}, on ${date} at ${time}. A confirmation email is on the way.${codeLine}`,
        state: INITIAL_STATE,
      };
    }

    return {
      reply: `Sorry, that time just became unavailable (${result.error ?? 'capacity reached'}). Let's try a different time — what time works?`,
      state: { step: 'RESERVATION_TIME', draft: { name, partySize, date, email } },
    };
  }

  return {
    reply: 'Please reply 1 to confirm or 2 to cancel.',
    state,
  };
}

// ---------------------------------------------------------
// Manage existing reservation
// ---------------------------------------------------------

async function handleManageCode(input: string, state: FlowState): Promise<FlowResult> {
  const code = input.trim().toUpperCase();

  if (code.length < 4) {
    return {
      reply: 'Please enter your reservation code (e.g. AB12CD).',
      state,
    };
  }

  const result = (await getReservationByCode(code)) as {
    success: boolean;
    name?: string;
    party_size?: number;
    reservation_date?: string;
    reservation_time?: string;
    status?: string;
    error?: string;
  };

  if (!result.success) {
    return {
      reply: "I couldn't find a reservation with that code. Please double check and try again, or reply 0 for the main menu.",
      state,
    };
  }

  const displayTime = result.reservation_time ? formatDisplayTime(result.reservation_time.slice(0, 5)) : '';

  const summary = [
    `Name: ${result.name}`,
    `Party size: ${result.party_size}`,
    `Date: ${result.reservation_date}`,
    `Time: ${displayTime}`,
    `Status: ${result.status}`,
  ].join('\n');

  if (result.status === 'cancelled') {
    return {
      reply: `${summary}\n\nThis reservation has already been cancelled. Reply 0 for the main menu.`,
      state: INITIAL_STATE,
    };
  }

  return {
    reply: `${summary}\n\n1. Cancel this reservation\n2. Change date/time\n3. Back to main menu`,
    state: { step: 'MANAGE_ACTION', draft: {}, manageCode: code },
  };
}

async function handleManageAction(input: string, state: FlowState): Promise<FlowResult> {
  const normalized = input.trim().toLowerCase();
  const code = state.manageCode;

  if (!code) {
    return { reply: MAIN_MENU_TEXT, state: INITIAL_STATE, buttons: MAIN_MENU_BUTTONS };
  }

  if (normalized === '1' || normalized.includes('cancel')) {
    const result = (await cancelReservationByCode(code)) as { success: boolean; error?: string };

    return {
      reply: result.success
        ? 'Your reservation has been cancelled. We hope to see you another time!'
        : `Sorry, something went wrong cancelling that reservation (${result.error ?? 'unknown error'}). Please try again or talk to our team.`,
      state: INITIAL_STATE,
    };
  }

  if (normalized === '2' || normalized.includes('change') || normalized.includes('modify')) {
    return {
      reply: "What date would you like to move it to? (e.g. '12th September', 'tomorrow', or YYYY-MM-DD)",
      state: { step: 'MANAGE_MODIFY_DATE', draft: {}, manageCode: code },
    };
  }

  if (normalized === '3' || normalized.includes('back')) {
    return { reply: MAIN_MENU_TEXT, state: INITIAL_STATE, buttons: MAIN_MENU_BUTTONS };
  }

  return {
    reply: '1. Cancel this reservation\n2. Change date/time\n3. Back to main menu',
    state,
  };
}

function handleManageModifyDate(input: string, state: FlowState): FlowResult {
  const date = parseDateInput(input);
  const todayISO = getLagosTodayISO();

  if (!date) {
    return {
      reply: "Sorry, I couldn't understand that date. Try '12th September', 'tomorrow', or YYYY-MM-DD.",
      state,
    };
  }

  if (date < todayISO) {
    return {
      reply: 'That date is in the past — could you give me a date from today onward?',
      state,
    };
  }

  return {
    reply: 'And what time would you like instead? (e.g. 7pm or 19:00)',
    state: { step: 'MANAGE_MODIFY_TIME', draft: { date }, manageCode: state.manageCode },
  };
}

async function handleManageModifyTime(input: string, state: FlowState): Promise<FlowResult> {
  const time = parseTimeInput(input);
  const { date } = state.draft;
  const code = state.manageCode;

  if (!time) {
    return {
      reply: "Sorry, I couldn't understand that time. Try something like 7pm or 19:00.",
      state,
    };
  }

  if (!date || !code) {
    return {
      reply: "Something went wrong — let's start over.",
      state: INITIAL_STATE,
      buttons: MAIN_MENU_BUTTONS,
    };
  }

  const result = (await modifyReservationByCode(code, date, time)) as {
    success: boolean;
    error?: string;
    reason?: string;
  };

  if (result.success) {
    return {
      reply: `Done! Your reservation has been moved to ${date} at ${formatDisplayTime(time)}.`,
      state: INITIAL_STATE,
    };
  }

  return {
    reply: `Sorry, that time isn't available (${result.error ?? 'capacity reached'}). What time would you like instead?`,
    state: { step: 'MANAGE_MODIFY_TIME', draft: { date }, manageCode: code },
  };
}