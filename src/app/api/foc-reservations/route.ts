import {
  createFocReservation,
  getFocSlots,
} from "@/lib/odoo/foc-reservations";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;


/* ============================================================
 * GET
 *
 * Odoo is the source of truth for FOC availability.
 *
 * Optional:
 * /api/foc-reservations?partySize=3
 * ========================================================== */

export async function GET(
  request: Request,
) {
  try {
    const url =
      new URL(
        request.url,
      );

    const partySizeRaw =
      url.searchParams.get(
        "partySize",
      );

    const partySize =
      partySizeRaw
        ? Number(
            partySizeRaw,
          )
        : undefined;

    const slots =
      await getFocSlots(
        partySize,
      );

    return Response.json(
      {
        success: true,
        slots,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (
    error
  ) {
    console.error(
      "FOC availability API error:",
      error,
    );

    return Response.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to load FOC availability.",
      },
      {
        status: 500,
      },
    );
  }
}


/* ============================================================
 * POST
 *
 * 1. Re-checks FOC placeholder in Odoo
 * 2. Claims it in Odoo
 * 3. Marks appointment booked
 * 4. Stores FOC/name/phone
 * 5. Sends V3 WhatsApp template
 * ========================================================== */

export async function POST(
  request: Request,
) {
  try {
    const body =
      await request.json();

    const name =
      String(
        body.name ??
          "",
      ).trim();

    const phone =
      String(
        body.phone ??
          "",
      ).trim();

    const partySize =
      Number(
        body.partySize,
      );

    const date =
      String(
        body.date ??
          "",
      ).trim();

    const time =
      String(
        body.time ??
          "",
      ).trim();


    /* --------------------------------------------------------
     * Basic API validation
     * ------------------------------------------------------ */

    if (!name) {
      return Response.json(
        {
          success: false,

          error:
            "Name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!phone) {
      return Response.json(
        {
          success: false,

          error:
            "Phone number is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isInteger(
        partySize,
      ) ||
      partySize < 1 ||
      partySize > 4
    ) {
      return Response.json(
        {
          success: false,

          error:
            "Party size must be between 1 and 4.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !date ||
      !time
    ) {
      return Response.json(
        {
          success: false,

          error:
            "Date and time are required.",
        },
        {
          status: 400,
        },
      );
    }


    console.log(
      "=== FOC API BOOKING REQUEST ===",
      {
        name,
        phone,
        partySize,
        date,
        time,
      },
    );


    /* --------------------------------------------------------
     * Odoo + WhatsApp
     * ------------------------------------------------------ */

    const result =
      await createFocReservation({
        name,
        phone,
        partySize,
        date,
        time,
      });


    if (
      !result.success
    ) {
      console.error(
        "FOC booking rejected",
        result,
      );

      return Response.json(
        result,
        {
          status: 409,
        },
      );
    }


    console.log(
      "=== FOC BOOKING COMPLETE ===",
      result,
    );


    return Response.json(
      {
        success: true,

        eventId:
          result.eventId,

        reservationCode:
          result.reservationCode,

        whatsappSent:
          result.whatsappSent,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (
    error
  ) {
    console.error(
      "FOC reservation API error:",
      error,
    );

    return Response.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to create FOC reservation.",
      },
      {
        status: 500,
      },
    );
  }
}