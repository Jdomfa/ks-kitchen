const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;
const ODOO_USERNAME = process.env.ODOO_USERNAME!;
const ODOO_API_KEY = process.env.ODOO_API_KEY!;

type JsonRpcResult<T> = { result?: T; error?: { message: string; data?: unknown } };

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

  const data: JsonRpcResult<T> = await res.json();

  if (data.error) {
    throw new Error(`Odoo error: ${data.error.message}`);
  }

  return data.result as T;
}

let cachedUid: number | null = null;

async function getUid(): Promise<number> {
  if (cachedUid) return cachedUid;

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

  cachedUid = data.result as number;
  return cachedUid;
}

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