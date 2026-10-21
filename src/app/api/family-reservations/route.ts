import {
  createFamilyReservation,
  getFamilyReservationSlots,
} from "@/lib/odoo/family-reservations";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

export async function GET(
  request: Request,
) {
  try {
    const url =
      new URL(
        request.url,
      );

    const rawPartySize =
      url.searchParams.get(
        "partySize",
      );

    const partySize =
      rawPartySize
        ? Number(
            rawPartySize,
          )
        : undefined;

    if (
      partySize !==
        undefined &&
      (
        !Number.isInteger(
          partySize,
        ) ||
        partySize < 1 ||
        partySize > 4
      )
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Invalid party size.",
        },
        {
          status: 400,
        },
      );
    }

    const slots =
      await getFamilyReservationSlots(
        partySize,
      );

    return Response.json(
      {
        success: true,
        slots,
      },
      {
        status: 200,

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
      "Family reservation GET failed:",
      error,
    );

    return Response.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to load reservation availability.",
      },
      {
        status: 500,
      },
    );
  }
}

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

    if (
      phone.replace(
        /\D/g,
        "",
      ).length < 9
    ) {
      return Response.json(
        {
          success: false,
          error:
            "A valid phone number is required.",
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

    const result =
      await createFamilyReservation({
        name,
        phone,
        partySize,
        date,
        time,
      });

    return Response.json(
      result,
      {
        status:
          result.success
            ? 200
            : 409,

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
      "Family reservation POST failed:",
      error,
    );

    return Response.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to create reservation.",
      },
      {
        status: 500,
      },
    );
  }
}