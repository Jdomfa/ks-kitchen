import {
  createFocReservation,
  getFocSlots,
} from "@/lib/odoo/foc-reservations";

export const dynamic =
  "force-dynamic";

export async function GET() {
  try {
    const slots =
      await getFocSlots();

    return Response.json({
      success: true,
      slots,
    });
  } catch (error) {
    console.error(
      "FOC availability error:",
      error,
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to load FOC availability.",
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

    const result =
      await createFocReservation({
        name:
          String(
            body.name ??
              "",
          ),

        phone:
          String(
            body.phone ??
              "",
          ),

        partySize:
          Number(
            body.partySize,
          ),

        date:
          String(
            body.date ??
              "",
          ),

        time:
          String(
            body.time ??
              "",
          ),
      });

    return Response.json(
      result,
      {
        status:
          result.success
            ? 200
            : 409,
      },
    );
  } catch (error) {
    console.error(
      "FOC reservation error:",
      error,
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to create the FOC reservation.",
      },
      {
        status: 500,
      },
    );
  }
}