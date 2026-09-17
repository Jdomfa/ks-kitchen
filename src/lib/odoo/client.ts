// Thin JSON-RPC client for Odoo's external API.
// Env vars intentionally left unset until the odoo.sh instance exists —
// every call below will throw a clear config error until they're added.

const ODOO_URL = process.env.ODOO_URL; // e.g. https://kskitchen.odoo.com
const ODOO_DB = process.env.ODOO_DB;
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_API_KEY = process.env.ODOO_API_KEY;

let cachedUid: number | null = null;

function assertConfigured() {
  if (!ODOO_URL || !ODOO_DB || !ODOO_USERNAME || !ODOO_API_KEY) {
    throw new Error(
      'Odoo is not configured yet. Set ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY once the odoo.sh instance is live.'
    );
  }
}

async function jsonRpc(endpoint: string, params: Record<string, unknown>) {
  assertConfigured();

  const res = await fetch(`${ODOO_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params,
      id: Math.floor(Math.random() * 1e9),
    }),
  });

  const json = await res.json();
  if (json.error) {
    throw new Error(json.error.data?.message || json.error.message || 'Odoo RPC error');
  }
  return json.result;
}

async function authenticate(): Promise<number> {
  if (cachedUid) return cachedUid;

  const uid = await jsonRpc('/jsonrpc', {
    service: 'common',
    method: 'authenticate',
    args: [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}],
  });

  if (!uid) throw new Error('Odoo authentication failed — check ODOO_USERNAME / ODOO_API_KEY.');
  cachedUid = uid;
  return uid;
}

export async function odooExecute<T = unknown>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  const uid = await authenticate();

  return jsonRpc('/jsonrpc', {
    service: 'object',
    method: 'execute_kw',
    args: [ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs],
  }) as Promise<T>;
}

export async function odooSearchRead<T = Record<string, unknown>>(
  model: string,
  domain: unknown[],
  fields: string[],
  opts: { limit?: number; order?: string } = {}
): Promise<T[]> {
  return odooExecute<T[]>(model, 'search_read', [domain, fields], opts);
}

export async function odooCreate(model: string, values: Record<string, unknown>): Promise<number> {
  return odooExecute<number>(model, 'create', [values]);
}

export async function odooWrite(model: string, ids: number[], values: Record<string, unknown>): Promise<boolean> {
  return odooExecute<boolean>(model, 'write', [ids, values]);
}