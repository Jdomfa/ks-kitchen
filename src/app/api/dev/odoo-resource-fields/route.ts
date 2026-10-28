import { NextResponse } from "next/server";
import { odooCall } from "@/lib/odoo/rpc";
import { getReservationAllocations } from "@/lib/odoo/reservation-allocation";

export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? "";
  const typeId = Number(process.env.ODOO_APPOINTMENT_TYPE_ID);
  try {
    const resources = await odooCall<unknown[]>(
      "appointment.resource",
      "search_read",
      [[["appointment_type_ids", "in", [typeId]]]],
      { fields: ["id", "name", "capacity", "linked_resource_ids"] },
    );
    const allocations = await getReservationAllocations(date, 2);
    return NextResponse.json({ typeId, resources, allocations });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}