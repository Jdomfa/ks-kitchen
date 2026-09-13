import { checkAvailability } from '@/lib/reservations/availability';
import {
  createReservation,
  getReservationByCode,
  getReservationByPhone,
  cancelReservationByCode,
  modifyReservationByCode,
} from '@/lib/reservations/tools';
import { sendReservationConfirmations } from '@/lib/notifications/confirmation';
import { notifyStaffOfHandoff } from '@/lib/notifications/handoff';
import { siteConfig } from '@/lib/site-config';

export type FlowStep =
  | 'MAIN_MENU'
  | 'RESERVATION_MENU'
  | 'ENQUIRY_MENU'
  | 'ENQUIRY_HANDOFF_MESSAGE'
  | 'ENQUIRY_HANDOFF_CONTACT'
  | 'RESERVATION_PARTY_SIZE'
  | 'RESERVATION_DATE'
  | 'RESERVATION_TIME'
  | 'RESERVATION_NAME'
  | 'RESERVATION_PHONE'
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

export type FlowButton = { id: string; title: string; url?: string };
export type SummaryRow = { label: string; value: string };

export type FlowResult = {
  reply: string;
  state: FlowState;
  buttons?: FlowButton[];
  inputType?: 'date';
  summary?: SummaryRow[];
};

const MENU_TEXT = `
Our full menu: TODO — add menu link here.
`.trim();

const MAIN_MENU_TEXT = "Welcome to K's Kitchen! How can I help?";

const MAIN_MENU_BUTTONS: FlowButton[] = [
  { id: 'menu_reservation', title: 'Reservations' },
  { id: 'menu_enquiries', title: 'Enquiries' },
  { id: 'menu_menu', title: 'Menu' },
];

const RESERVATION_MENU_TEXT = 'Would you like to make a new reservation, or manage an existing one?';

const RESERVATION_MENU_BUTTONS: FlowButton[] = [
  { id: 'new', title: 'New reservation' },
  { id: 'manage', title: 'Manage existing' },
];

const PARTY_SIZE_BUTTONS: FlowButton[] = [
  { id: '1', title: '1 guest' },
  { id: '2', title: '2 guests' },
  { id: '3', title: '3 guests' },
  { id: '4+', title: '4+ guests' },
];

const PRESET_TIME_SLOTS = ['16:00', '17:00', '18:00', '19:00'];

// ---------------------------------------------------------
// Enquiry content
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

const ENQUIRY_MENU_BUTTONS: FlowButton[] = [
  { id: '1', title: 'Opening Hours' },
  { id: '2', title: 'Location' },
  { id: '3', title: 'Takeaway & Delivery' },
  { id: '4', title: 'Contact & Parking' },
  { id: '5', title: 'Talk to our team' },
];

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
      reply: `${topic.label}\n\n${topic.text}`,
      state: { step: 'ENQUIRY_MENU', draft: {} },
      buttons: ENQUIRY_MENU_BUTTONS,
    };
  }

  if (normalized === '5' || normalized.includes('team') || normalized.includes('agent')) {
    return {
      reply: "Sure — what would you like to ask our team? Type your question and we'll get back to you shortly.",
      state: { step: 'ENQUIRY_HANDOFF_MESSAGE', draft: {} },
    };
  }

  return {
    reply: 'What would you like to know?',
    state: { step: 'ENQUIRY_MENU', draft: {} },
    buttons: ENQUIRY_MENU_BUTTONS,
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
      buttons: MAIN_MENU_BUTTONS,
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
    buttons: MAIN_MENU_BUTTONS,
  };
}

// ---------------------------------------------------------
// Date parsing
// ---------------------------------------------------------

function getLagosTodayISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function parseDateInput(raw: string): string | null {
  const text = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return null;
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

async function getAvailablePresetSlots(date: string, partySize: number): Promise<string[]> {
  const checks = await Promise.all(
    PRESET_TIME_SLOTS.map(async (time) => {
      const result = await checkAvailability({ date, time, partySize });
      return { time, available: result.available };
    })
  );

  return checks.filter((c) => c.available).map((c) => c.time);
}

function looksLikePhoneNumber(raw: string): boolean {
  const digitsOnly = raw.replace(/\D/g, '');
  return digitsOnly.length >= 9 && digitsOnly.length === raw.replace(/[\s+()-]/g, '').length;
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

    case 'RESERVATION_PARTY_SIZE':
      return handleReservationPartySize(input, state);

    case 'RESERVATION_DATE':
      return handleReservationDate(input, state);

    case 'RESERVATION_TIME':
      return handleReservationTime(input, state);

    case 'RESERVATION_NAME':
      return handleReservationName(input, state);

    case 'RESERVATION_PHONE':
      return handleReservationPhone(input, state);

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

  if (normalized === 'menu_reservation' || normalized.includes('reserv')) {
    return {
      reply: RESERVATION_MENU_TEXT,
      state: { step: 'RESERVATION_MENU', draft: {} },
      buttons: RESERVATION_MENU_BUTTONS,
    };
  }

  if (normalized === 'menu_enquiries' || normalized.includes('enquir')) {
    return {
      reply: 'What would you like to know?',
      state: { step: 'ENQUIRY_MENU', draft: {} },
      buttons: ENQUIRY_MENU_BUTTONS,
    };
  }

  if (normalized === 'menu_menu' || normalized === 'menu') {
    return {
      reply: MENU_TEXT,
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

  if (normalized === 'new' || normalized.includes('new')) {
    return {
      reply: 'How many guests?',
      state: { step: 'RESERVATION_PARTY_SIZE', draft: {} },
      buttons: PARTY_SIZE_BUTTONS,
    };
  }

  if (normalized === 'manage' || normalized.includes('manage') || normalized.includes('existing')) {
    return {
      reply: 'Please enter your reservation code, or the phone number you booked with.',
      state: { step: 'MANAGE_CODE', draft: {} },
    };
  }

  return {
    reply: RESERVATION_MENU_TEXT,
    state: { step: 'RESERVATION_MENU', draft: {} },
    buttons: RESERVATION_MENU_BUTTONS,
  };
}

function handleReservationPartySize(input: string, state: FlowState): FlowResult {
  const normalized = input.trim();

  if (normalized === '4+') {
    const message = encodeURIComponent("Hi, I'd like to book a table for 4 or more guests.");
    const url = `https://wa.me/${siteConfig.whatsappNumber}?text=${message}`;

    return {
      reply:
        "For parties of 4 or more, our team will help you directly on WhatsApp to sort out the best setup for your group.",
      state: INITIAL_STATE,
      buttons: [{ id: 'open_whatsapp', title: 'Chat on WhatsApp', url }],
    };
  }

  const partySize = parseInt(normalized, 10);

  if (![1, 2, 3].includes(partySize)) {
    return {
      reply: 'Please choose a party size below.',
      state,
      buttons: PARTY_SIZE_BUTTONS,
    };
  }

  return {
    reply: 'What date would you like to book?',
    state: { step: 'RESERVATION_DATE', draft: { ...state.draft, partySize } },
    inputType: 'date',
  };
}

async function handleReservationDate(input: string, state: FlowState): Promise<FlowResult> {
  const date = parseDateInput(input);
  const todayISO = getLagosTodayISO();

  if (!date) {
    return {
      reply: 'Please choose a valid date.',
      state,
      inputType: 'date',
    };
  }

  if (date < todayISO) {
    return {
      reply: 'That date is in the past — please choose today or later.',
      state,
      inputType: 'date',
    };
  }

  const { partySize } = state.draft;

  if (!partySize) {
    return {
      reply: "Something went wrong — let's start over.",
      state: INITIAL_STATE,
      buttons: MAIN_MENU_BUTTONS,
    };
  }

  const availableSlots = await getAvailablePresetSlots(date, partySize);

  if (availableSlots.length === 0) {
    return {
      reply: `Sorry, we don't have any dinner slots available on ${date} for ${partySize} guests. We only take reservations between 4:00 PM and 7:00 PM — please choose another date.`,
      state: { step: 'RESERVATION_DATE', draft: state.draft },
      inputType: 'date',
    };
  }

  return {
    reply: `Here's what's available on ${date}:`,
    state: { step: 'RESERVATION_TIME', draft: { ...state.draft, date }, alternatives: availableSlots },
    buttons: availableSlots.map((t) => ({ id: t, title: formatDisplayTime(t) })),
  };
}

function handleReservationTime(input: string, state: FlowState): FlowResult {
  const time = input.trim();
  const options = state.alternatives ?? PRESET_TIME_SLOTS;

  if (!options.includes(time)) {
    return {
      reply: 'Please choose one of the available times below.',
      state,
      buttons: options.map((t) => ({ id: t, title: formatDisplayTime(t) })),
    };
  }

  return {
    reply: 'What name should the reservation be under?',
    state: { step: 'RESERVATION_NAME', draft: { ...state.draft, time } },
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
    reply: `Thanks, ${name}! What's the best phone number to reach you on for this booking?`,
    state: { step: 'RESERVATION_PHONE', draft: { ...state.draft, name } },
  };
}

function handleReservationPhone(input: string, state: FlowState): FlowResult {
  const phone = input.trim();

  if (phone.replace(/\D/g, '').length < 9) {
    return {
      reply: 'Please enter a valid phone number (e.g. 08012345678).',
      state,
    };
  }

  const draft = { ...state.draft, phone };
  const { name, partySize, date, time } = draft;

  return {
    reply: 'Please confirm your booking:',
    state: { step: 'RESERVATION_CONFIRM', draft },
    summary: [
      { label: 'Name', value: name ?? '' },
      { label: 'Party size', value: String(partySize ?? '') },
      { label: 'Date', value: date ?? '' },
      { label: 'Time', value: time ? formatDisplayTime(time) : '' },
      { label: 'Phone', value: phone },
    ],
    buttons: [
      { id: 'confirm', title: 'Confirm' },
      { id: 'cancel', title: 'Cancel' },
    ],
  };
}

async function handleReservationConfirm(
  input: string,
  state: FlowState,
  channel: 'website' | 'whatsapp'
): Promise<FlowResult> {
  const normalized = input.trim().toLowerCase();

  if (normalized === 'cancel' || normalized === 'no') {
    return {
      reply: 'No problem, your booking was cancelled.',
      state: INITIAL_STATE,
      buttons: MAIN_MENU_BUTTONS,
    };
  }

  if (normalized === 'confirm' || normalized === 'yes') {
    const { name, partySize, date, time, phone } = state.draft;

    if (!name || !partySize || !date || !time || !phone) {
      return {
        reply: "Something went wrong with your booking details — let's start over.",
        state: INITIAL_STATE,
        buttons: MAIN_MENU_BUTTONS,
      };
    }

    const result = (await createReservation({
      name,
      phone,
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
        phone,
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
        reply: `You're booked! Reservation confirmed for ${name}, party of ${partySize}, on ${date} at ${formatDisplayTime(
          time
        )}. A confirmation will be sent to you on WhatsApp.${codeLine}`,
        state: INITIAL_STATE,
        buttons: MAIN_MENU_BUTTONS,
      };
    }

    const availableSlots = await getAvailablePresetSlots(date, partySize);

    if (availableSlots.length === 0) {
      return {
        reply: `Sorry, that time just became unavailable and there's nothing else open on ${date}. Please choose another date.`,
        state: { step: 'RESERVATION_DATE', draft: { partySize } },
        inputType: 'date',
      };
    }

    return {
      reply: `Sorry, that time just became unavailable. Here's what's still open on ${date}:`,
      state: { step: 'RESERVATION_TIME', draft: { partySize, date }, alternatives: availableSlots },
      buttons: availableSlots.map((t) => ({ id: t, title: formatDisplayTime(t) })),
    };
  }

  return {
    reply: 'Please confirm or cancel.',
    state,
    buttons: [
      { id: 'confirm', title: 'Confirm' },
      { id: 'cancel', title: 'Cancel' },
    ],
  };
}

// ---------------------------------------------------------
// Manage existing reservation — code OR phone number
// ---------------------------------------------------------

async function handleManageCode(input: string, state: FlowState): Promise<FlowResult> {
  const raw = input.trim();

  if (raw.length < 4) {
    return {
      reply: 'Please enter your reservation code, or the phone number you booked with.',
      state,
    };
  }

  if (looksLikePhoneNumber(raw)) {
    const phoneResult = (await getReservationByPhone(raw)) as {
      success: boolean;
      name?: string;
      party_size?: number;
      reservation_date?: string;
      reservation_time?: string;
      status?: string;
      reservation_code?: string;
      error?: string;
      multiple?: boolean;
    };

    if (phoneResult.success) {
      return showManageSummary(phoneResult, phoneResult.reservation_code!);
    }

    return {
      reply: `${phoneResult.error ?? "I couldn't find a reservation with that phone number."} You can also try your reservation code.`,
      state,
    };
  }

  const code = raw.toUpperCase();

  const codeResult = (await getReservationByCode(code)) as {
    success: boolean;
    name?: string;
    party_size?: number;
    reservation_date?: string;
    reservation_time?: string;
    status?: string;
    error?: string;
  };

  if (!codeResult.success) {
    return {
      reply: "I couldn't find a reservation with that code or phone number. Please double check and try again, or reply 0 for the main menu.",
      state,
    };
  }

  return showManageSummary(codeResult, code);
}

function showManageSummary(
  result: {
    name?: string;
    party_size?: number;
    reservation_date?: string;
    reservation_time?: string;
    status?: string;
  },
  code: string
): FlowResult {
  const displayTime = result.reservation_time
    ? formatDisplayTime(result.reservation_time.slice(0, 5))
    : '';

  if (result.status === 'cancelled') {
    return {
      reply: 'This reservation has already been cancelled.',
      state: INITIAL_STATE,
      buttons: MAIN_MENU_BUTTONS,
      summary: [
        { label: 'Name', value: result.name ?? '' },
        { label: 'Party size', value: String(result.party_size ?? '') },
        { label: 'Date', value: result.reservation_date ?? '' },
        { label: 'Time', value: displayTime },
        { label: 'Status', value: result.status ?? '' },
      ],
    };
  }

  return {
    reply: 'Here are your reservation details:',
    state: { step: 'MANAGE_ACTION', draft: {}, manageCode: code },
    summary: [
      { label: 'Name', value: result.name ?? '' },
      { label: 'Party size', value: String(result.party_size ?? '') },
      { label: 'Date', value: result.reservation_date ?? '' },
      { label: 'Time', value: displayTime },
      { label: 'Status', value: result.status ?? '' },
    ],
    buttons: [
      { id: '1', title: 'Cancel reservation' },
      { id: '2', title: 'Change date/time' },
      { id: '3', title: 'Back to main menu' },
    ],
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
      buttons: MAIN_MENU_BUTTONS,
    };
  }

  if (normalized === '2' || normalized.includes('change') || normalized.includes('modify')) {
    return {
      reply: 'What date would you like to move it to?',
      state: { step: 'MANAGE_MODIFY_DATE', draft: {}, manageCode: code },
      inputType: 'date',
    };
  }

  if (normalized === '3' || normalized.includes('back')) {
    return { reply: MAIN_MENU_TEXT, state: INITIAL_STATE, buttons: MAIN_MENU_BUTTONS };
  }

  return {
    reply: 'Please choose an option below.',
    state,
    buttons: [
      { id: '1', title: 'Cancel reservation' },
      { id: '2', title: 'Change date/time' },
      { id: '3', title: 'Back to main menu' },
    ],
  };
}

function handleManageModifyDate(input: string, state: FlowState): FlowResult {
  const date = parseDateInput(input);
  const todayISO = getLagosTodayISO();

  if (!date) {
    return { reply: 'Please choose a valid date.', state, inputType: 'date' };
  }

  if (date < todayISO) {
    return {
      reply: 'That date is in the past — please choose today or later.',
      state,
      inputType: 'date',
    };
  }

  return {
    reply: 'And what time would you like instead? (e.g. 18:00)',
    state: { step: 'MANAGE_MODIFY_TIME', draft: { date }, manageCode: state.manageCode },
  };
}

async function handleManageModifyTime(input: string, state: FlowState): Promise<FlowResult> {
  const time = input.trim();
  const { date } = state.draft;
  const code = state.manageCode;

  if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(time)) {
    return {
      reply: 'Please enter a time in HH:MM format, e.g. 18:00.',
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
      buttons: MAIN_MENU_BUTTONS,
    };
  }

  return {
    reply: `Sorry, that time isn't available (${result.error ?? 'capacity reached'}). What time would you like instead?`,
    state: { step: 'MANAGE_MODIFY_TIME', draft: { date }, manageCode: code },
  };
}