const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;
const ODOO_USERNAME = process.env.ODOO_USERNAME!;
const ODOO_API_KEY = process.env.ODOO_API_KEY!;

const LAGOS_UTC_OFFSET_HOURS = 1;

type JsonRpcResult<T> = {
  result?: T;
  error?: { message?: string; data?: { message?: string; debug?: string } };
};

let cachedUid: number | null = null;

async function getUid(): Promise<number> {
  if (cachedUid !== null) return cachedUid;

  const response = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}],
      },
      id: Date.now(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Odoo authentication HTTP error: ${response.status}`);
  }

  const data = (await response.json()) as JsonRpcResult<number>;
  if (!data.result) {
    throw new Error(
      data.error?.data?.message ||
        data.error?.message ||
        "Odoo authentication failed.",
    );
  }

  cachedUid = data.result;
  return cachedUid;
}

export async function odooCall<T>(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [ODOO_DB, await getUid(), ODOO_API_KEY, model, method, args, kwargs],
      },
      id: Date.now(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Odoo HTTP error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as JsonRpcResult<T>;

  if (data.error) {
    throw new Error(
      `Odoo error: ${
        data.error.data?.message ||
        data.error.data?.debug ||
        data.error.message ||
        "Unknown Odoo error"
      }`,
    );
  }

  if (data.result === undefined) {
    throw new Error(`Odoo returned no result for ${model}.${method}`);
  }

  return data.result;
}

function formatOdooUtc(dt: Date): string {
  return dt.toISOString().slice(0, 19).replace("T", " ");
}

/** Lagos local date/time -> Odoo UTC "start"/"stop" strings. */
export function odooUtcRange(
  date: string,
  time: string,
  durationHours: number,
): { start: string; stop: string } {
  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    throw new Error(`Invalid time value: "${time}"`);
  }

  const start = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid date value: "${date}"`);
  }

  start.setUTCHours(hours - LAGOS_UTC_OFFSET_HOURS, minutes, 0, 0);
  const stop = new Date(start.getTime() + durationHours * 3_600_000);

  return { start: formatOdooUtc(start), stop: formatOdooUtc(stop) };
}