const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;
const ODOO_USERNAME = process.env.ODOO_USERNAME!;
const ODOO_API_KEY = process.env.ODOO_API_KEY!;
const LAGOS_UTC_OFFSET_HOURS = 1; // Africa/Lagos has no DST, always UTC+1

async function odooCall<T>(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [ODOO_DB, await getUid(), ODOO_API_KEY, model, method, args, kwargs],
      },
    }),
  });

  const data = await res.json();

  if (data.error) {
    const detail =
      data.error.data?.message ||
      data.error.data?.debug ||
      data.error.message;
    throw new Error(`Odoo error: ${detail}`);
  }

  return data.result as T;
}

// ---------------------------------------------------------
// Authentication
// ---------------------------------------------------------

let uidPromise: Promise<number> | null = null;

function getUid(): Promise<number> {
  if (!uidPromise) {
    uidPromise = authenticate().catch((err) => {
      uidPromise = null; // allow a later call to retry
      throw err;
    });
  }
  return uidPromise;
}

async function authenticate(): Promise<number> {
  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'common',
        method: 'authenticate',
        args: [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}],
      },
    }),
  });

  const data = await res.json();

  if (!data.result) {
    throw new Error('Odoo authentication failed — check ODOO_DB, ODOO_USERNAME, ODOO_API_KEY.');
  }

  return data.result as number;
}

// ---------------------------------------------------------
// Helpdesk (customer handoff tickets)
// ---------------------------------------------------------

export async function createHelpdeskTicket(args: {
  customerName: string;
  whatsappNumber: string;
  message: string;
}): Promise<number> {
  const teamName = process.env.ODOO_HELPDESK_TEAM_NAME || 'WhatsApp Support';

  const teamIds = await odooCall<number[]>('helpdesk.team', 'search', [
    [['name', '=', teamName]],
  ]);

  if (!teamIds || teamIds.length === 0) {
    throw new Error(`Odoo helpdesk team "${teamName}" not found.`);
  }

  const ticketId = await odooCall<number>('helpdesk.ticket', 'create', [
    {
      name: `WhatsApp: ${args.customerName}`,
      description: args.message,
      team_id: teamIds[0],
      x_studio_whatsapp_number: args.whatsappNumber,
    },
  ]);

  return ticketId;
}

export async function logCustomerMessageOnTicket(ticketId: number, message: string): Promise<void> {
  await odooCall('helpdesk.ticket', 'message_post', [ticketId], {
    body: `<b>Customer:</b> ${message}`,
    message_type: 'comment',
  });
}

export async function clearSendReplyFlag(ticketId: number): Promise<void> {
  await odooCall('helpdesk.ticket', 'write', [
    [ticketId],
    { x_studio_send_reply_to_customer: false },
  ]);
}

export async function logSentReplyOnTicket(ticketId: number, message: string): Promise<void> {
  await odooCall('helpdesk.ticket', 'message_post', [ticketId], {
    body: `<b>Sent to customer via WhatsApp:</b> ${message}`,
    message_type: 'comment',
  });
}

// ---------------------------------------------------------
// Reservation → Odoo Appointments sync
// ---------------------------------------------------------

const RESERVATION_DURATION_MS = 2 * 60 * 60 * 1000;

/**
 * Converts a Lagos-local date + time into an Odoo UTC datetime string.
 * `offsetMs` shifts the result forward, so the stop time is derived from a
 * real timestamp rather than string arithmetic — this handles both the
 * "24:30" overflow case and midnight rollover into the next UTC day.
 */
function toOdooUtc(date: string, time: string, offsetMs = 0): string {
  const [hours, minutes] = time.split(':').map(Number);
  const dt = new Date(`${date}T00:00:00Z`);
  dt.setUTCHours(hours - LAGOS_UTC_OFFSET_HOURS, minutes, 0, 0);
  return new Date(dt.getTime() + offsetMs)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
}

const APPOINTMENT_TYPE_ID = Number(process.env.ODOO_APPOINTMENT_TYPE_ID);
const DEFAULT_PARTNER_ID = Number(process.env.ODOO_DEFAULT_PARTNER_ID ?? 3);

type ManyToOneRead = [number, string] | false;

let cachedAppointmentProductId: number | null = null;

/**
 * calendar.booking requires product_id. Rather than hardcoding an ID,
 * read the product off the appointment type so it stays correct across
 * databases. ODOO_APPOINTMENT_PRODUCT_ID overrides if you need it to.
 */
async function getAppointmentProductId(): Promise<number> {
  if (cachedAppointmentProductId) return cachedAppointmentProductId;

  const override = Number(process.env.ODOO_APPOINTMENT_PRODUCT_ID);
  if (override) {
    cachedAppointmentProductId = override;
    return override;
  }

  const [apptType] = await odooCall<{ product_id: ManyToOneRead }[]>(
    'appointment.type',
    'read',
    [[APPOINTMENT_TYPE_ID], ['product_id']]
  );

  const productField = apptType?.product_id;

  if (!productField) {
    throw new Error(
      `Appointment type ${APPOINTMENT_TYPE_ID} has no product_id set. Assign a product in Odoo (Appointments → Configuration → Appointment Types), or set ODOO_APPOINTMENT_PRODUCT_ID.`
    );
  }

  cachedAppointmentProductId = productField[0];
  return cachedAppointmentProductId;
}

export async function pushReservationToOdoo(args: {
  reservationId: string;
  reservationCode?: string;
  name: string;
  phone?: string;
  partySize: number;
  date: string;
  time: string;
}): Promise<number> {
  const start = toOdooUtc(args.date, args.time);
  const stop = toOdooUtc(args.date, args.time, RESERVATION_DURATION_MS);

  const bookingName = `Table Reservation — ${args.name}${
    args.reservationCode ? ` [${args.reservationCode}]` : ''
  }`;

  // calendar.booking is the public "request" record — creating it
  // triggers Odoo's own auto-assignment logic (requires is_auto_assign
  // enabled on the appointment type) and generates a calendar.event
  // behind the scenes. action_book_appointment is a private backend
  // method and cannot be called this way, hence this two-step approach.
  const bookingId = await odooCall<number>('calendar.booking', 'create', [
    {
      appointment_type_id: APPOINTMENT_TYPE_ID,
      product_id: await getAppointmentProductId(),
      partner_id: DEFAULT_PARTNER_ID,
      start,
      stop,
      asked_capacity: args.partySize,
      name: bookingName,
    },
  ]);

  const [bookingRecord] = await odooCall<{ calendar_event_id: ManyToOneRead }[]>(
    'calendar.booking',
    'read',
    [[bookingId], ['calendar_event_id']]
  );

  const eventField = bookingRecord?.calendar_event_id;

  if (!eventField) {
    throw new Error(
      `Odoo booking ${bookingId} was created but no calendar event was generated — check that appointment type ${APPOINTMENT_TYPE_ID} has auto-assignment enabled and a table was actually available.`
    );
  }

  // Odoo's read() returns many2one fields as [id, displayName] tuples.
  return eventField[0];
}

export async function updateReservationInOdoo(
  odooEventId: number,
  args: { date: string; time: string }
): Promise<void> {
  const start = toOdooUtc(args.date, args.time);
  const stop = toOdooUtc(args.date, args.time, RESERVATION_DURATION_MS);

  await odooCall('calendar.event', 'write', [[odooEventId], { start, stop }]);
}

export async function deleteReservationFromOdoo(odooEventId: number): Promise<void> {
  await odooCall('calendar.event', 'unlink', [[odooEventId]]);
}
