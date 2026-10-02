import OdooSlotsBoard
  from "./OdooSlotsBoard";

import {
  getAllPlaceholders,
} from "@/lib/odoo/placeholder";

export const dynamic =
  "force-dynamic";

export default async function OdooSlotsPage() {
  let slots:
    Awaited<
      ReturnType<
        typeof getAllPlaceholders
      >
    > = [];

  let error:
    | string
    | null = null;

  try {
    slots =
      await getAllPlaceholders();
  } catch (err) {
    console.error(
      "Failed to load Odoo reservation slots:",
      err
    );

    error =
      err instanceof Error
        ? err.message
        : "Unable to load reservation slots from Odoo.";
  }

  return (
    <OdooSlotsBoard
      initialSlots={slots}
      error={error}
      odooBaseUrl={
        process.env
          .ODOO_URL ?? ""
      }
    />
  );
}