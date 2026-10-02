import { NextResponse } from "next/server";

const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;
const ODOO_USERNAME = process.env.ODOO_USERNAME!;
const ODOO_API_KEY = process.env.ODOO_API_KEY!;

type JsonRpcError = {
  message?: string;
  data?: {
    message?: string;
    debug?: string;
  };
};

type JsonRpcResponse<T> = {
  jsonrpc?: string;
  id?: number | null;
  result?: T;
  error?: JsonRpcError;
};

let cachedUid: number | null = null;

async function getUid(): Promise<number> {
  if (cachedUid !== null) {
    return cachedUid;
  }

  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [
          ODOO_DB,
          ODOO_USERNAME,
          ODOO_API_KEY,
          {},
        ],
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `Odoo authentication HTTP error: ${res.status} ${res.statusText}`
    );
  }

  const data =
    (await res.json()) as JsonRpcResponse<number>;

  if (data.error) {
    const detail =
      data.error.data?.message ||
      data.error.data?.debug ||
      data.error.message ||
      "Unknown Odoo authentication error";

    throw new Error(`Odoo authentication failed: ${detail}`);
  }

  if (typeof data.result !== "number") {
    throw new Error(
      "Odoo authentication failed. No numeric user ID was returned."
    );
  }

  cachedUid = data.result;

  return data.result;
}

async function odooCall<T>(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  const uid = await getUid();

  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
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
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `Odoo HTTP error: ${res.status} ${res.statusText}`
    );
  }

  const data =
    (await res.json()) as JsonRpcResponse<T>;

  if (data.error) {
    const detail =
      data.error.data?.message ||
      data.error.data?.debug ||
      data.error.message ||
      "Unknown Odoo error";

    throw new Error(`Odoo error: ${detail}`);
  }

  if (data.result === undefined) {
    throw new Error(
      `Odoo returned no result for ${model}.${method}`
    );
  }

  return data.result;
}

type OdooFieldDefinition = {
  string?: string;
  type?: string;
  relation?: string;
};

type OdooFields = Record<
  string,
  OdooFieldDefinition
>;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const fields = await odooCall<OdooFields>(
      "appointment.resource",
      "fields_get",
      [],
      {
        attributes: [
          "string",
          "type",
          "relation",
        ],
      }
    );

    const relevantFields = Object.entries(fields)
      .filter(([fieldName, definition]) => {
        const haystack = [
          fieldName,
          definition.string ?? "",
          definition.relation ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return (
          haystack.includes("capacity") ||
          haystack.includes("seat") ||
          haystack.includes("resource") ||
          haystack.includes("name") ||
          haystack.includes("appointment")
        );
      })
      .map(([field, definition]) => ({
        field,
        label: definition.string ?? field,
        type: definition.type ?? "unknown",
        relation: definition.relation,
      }))
      .sort((a, b) =>
        a.field.localeCompare(b.field)
      );

    return NextResponse.json({
      count: relevantFields.length,
      fields: relevantFields,
    });
  } catch (error) {
    console.error(
      "Failed to inspect appointment.resource fields:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}