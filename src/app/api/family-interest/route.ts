import {
  createServiceClient,
} from "@/lib/supabase/service";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

function normalizePhone(
  raw: string,
) {
  let phone =
    raw
      .trim()
      .replace(
        /[\s()-]/g,
        "",
      );

  if (
    phone.startsWith(
      "00",
    )
  ) {
    phone =
      `+${phone.slice(
        2,
      )}`;
  }

  if (
    phone.startsWith(
      "0",
    )
  ) {
    phone =
      `+234${phone.slice(
        1,
      )}`;
  }

  if (
    !phone.startsWith(
      "+",
    ) &&
    /^\d+$/.test(
      phone,
    )
  ) {
    phone =
      `+${phone}`;
  }

  return phone;
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
      normalizePhone(
        String(
          body.phone ??
            "",
        ),
      );

    if (!name) {
      return Response.json(
        {
          success:
            false,

          error:
            "Name is required.",
        },
        {
          status:
            400,
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
          success:
            false,

          error:
            "A valid phone number is required.",
        },
        {
          status:
            400,
        },
      );
    }

    const supabase =
      createServiceClient();

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "reservation_interest",
        )
        .insert({
          name,
          phone,

          source:
            "family_another_day",
        })
        .select(
          "id",
        )
        .single();

    if (error) {
      console.error(
        "reservation_interest insert failed:",
        error,
      );

      return Response.json(
        {
          success:
            false,

          error:
            "Unable to save your details.",
        },
        {
          status:
            500,
        },
      );
    }

    return Response.json({
      success:
        true,

      id:
        data.id,
    });
  } catch (
    error
  ) {
    console.error(
      "Family interest POST failed:",
      error,
    );

    return Response.json(
      {
        success:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to save your details.",
      },
      {
        status:
          500,
      },
    );
  }
}