import {

  sendReservationConfirmationWhatsApp,

} from "@/lib/odoo/client";



const ODOO_URL =

  process.env.ODOO_URL!;



const ODOO_DB =

  process.env.ODOO_DB!;



const ODOO_USERNAME =

  process.env.ODOO_USERNAME!;



const ODOO_API_KEY =

  process.env.ODOO_API_KEY!;



const META_FIELD =

  "x_studio_reservation_metadata_1";



const LAGOS_UTC_OFFSET_HOURS =

  1;



const FAMILY_SCHEDULE: Record<string, string[]> = {
  "2026-10-22": ["16:00", "19:00", "21:00"],
  "2026-10-23": ["18:00", "20:00"],
};

const TABLE_CAPACITY: Record<number, number> = {
  26: 2, // Table 1
  62: 2, // Table 2
  63: 2, // Table 3
  64: 2, // Table 4
  65: 4, // Table 5
  66: 4, // Table 6
  67: 2, // Table 7
  68: 2, // Table 8
  69: 2, // Table 9
  70: 2, // Table 10
  71: 2, // Table 11
  72: 2, // Table 12
  73: 4, // Table 13
  74: 4, // Table 14
  75: 4, // Table 15
};

const FRIDAY_RESOURCE_IDS = new Set([
  65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75,
]);

const PLACEHOLDER_NAME = "Family Placeholder";

function isAllowedFamilySlot(
  date: string,
  time: string,
): boolean {
  return FAMILY_SCHEDULE[date]?.includes(time) ?? false;
}

function isAllowedFamilyResource(
  date: string,
  resourceId: number | undefined,
): boolean {
  if (!resourceId) {
    return false;
  }

  if (date === "2026-10-23") {
    return FRIDAY_RESOURCE_IDS.has(resourceId);
  }

  return true;
}



let cachedUid:

  | number

  | null = null;



type JsonRpcResult<T> = {

  result?: T;



  error?: {

    message?: string;



    data?: {

      message?: string;

      debug?: string;

    };

  };

};



type CalendarEventRecord = {

  id: number;



  name: string;



  start: string;



  stop: string;



  resource_ids: number[];



  appointment_status:

    | string

    | false;



  appointment_booker_id?:

    | [number, string]

    | false;



  phone_number?:

    | string

    | false;



  x_studio_reservation_metadata_1?:

    | string

    | false;

};





type PartnerRecord = {

  id: number;



  name: string;



  phone:

    | string

    | false;

};



export type FamilyReservationSlot = {

  date: string;

  time: string;

};



export type CreateFamilyReservationInput = {

  name: string;



  phone: string;



  partySize: number;



  date: string;



  time: string;

};



export type CreateFamilyReservationResult = {

  success: boolean;



  error?: string;



  eventId?: number;



  reservationCode?: string;



  whatsappSent?: boolean;

};







async function getUid(): Promise<number> {

  if (cachedUid) {

    return cachedUid;

  }



  if (

    !ODOO_URL ||

    !ODOO_DB ||

    !ODOO_USERNAME ||

    !ODOO_API_KEY

  ) {

    throw new Error(

      "Missing Odoo environment variables.",

    );

  }



  const response =

    await fetch(

      `${ODOO_URL}/jsonrpc`,

      {

        method: "POST",



        headers: {

          "Content-Type":

            "application/json",

        },



        body: JSON.stringify({

          jsonrpc:

            "2.0",



          method:

            "call",



          params: {

            service:

              "common",



            method:

              "authenticate",



            args: [

              ODOO_DB,

              ODOO_USERNAME,

              ODOO_API_KEY,

              {},

            ],

          },



          id:

            Date.now(),

        }),



        cache:

          "no-store",

      },

    );



  if (!response.ok) {

    throw new Error(

      `Odoo authentication HTTP ${response.status}`,

    );

  }



  const data =

    (await response.json()) as JsonRpcResult<number>;



  if (

    data.error ||

    !data.result

  ) {

    throw new Error(

      data.error?.data?.message ??

        data.error?.message ??

        "Odoo authentication failed.",

    );

  }



  cachedUid =

    data.result;



  return cachedUid;

}







async function odooCall<T>(

  model: string,

  method: string,

  args: unknown[],

  kwargs:

    Record<

      string,

      unknown

    > = {},

): Promise<T> {

  const uid =

    await getUid();



  const response =

    await fetch(

      `${ODOO_URL}/jsonrpc`,

      {

        method:

          "POST",



        headers: {

          "Content-Type":

            "application/json",

        },



        body:

          JSON.stringify({

            jsonrpc:

              "2.0",



            method:

              "call",



            params: {

              service:

                "object",



              method:

                "execute_kw",



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



            id:

              Date.now(),

          }),



        cache:

          "no-store",

      },

    );



  if (!response.ok) {

    throw new Error(

      `Odoo ${model}.${method} HTTP ${response.status}`,

    );

  }



  const data =

    (await response.json()) as JsonRpcResult<T>;



  if (data.error) {

    console.error(

      "Odoo family reservation RPC error:",

      {

        model,

        method,



        error:

          data.error,

      },

    );



    throw new Error(

      data.error.data?.message ??

        data.error.message ??

        `${model}.${method} failed.`,

    );

  }



  return data.result as T;

}







function toOdooUtcDatetime(

  date: string,

  time: string,

): string {

  const [

    hours,

    minutes,

  ] =

    time

      .split(":")

      .map(Number);



  const value =

    new Date(

      `${date}T00:00:00Z`,

    );



  value.setUTCHours(

    hours -

      LAGOS_UTC_OFFSET_HOURS,

    minutes,

    0,

    0,

  );



  return value

    .toISOString()

    .slice(0, 19)

    .replace(

      "T",

      " ",

    );

}



function fromOdooUtcDatetime(

  value: string,

): FamilyReservationSlot {

  const utcDate =

    new Date(

      `${value.replace(

        " ",

        "T",

      )}Z`,

    );



  const lagosDate =

    new Date(

      utcDate.getTime() +

        LAGOS_UTC_OFFSET_HOURS *

          60 *

          60 *

          1000,

    );



  return {

    date:

      lagosDate

        .toISOString()

        .slice(

          0,

          10,

        ),



    time:

      lagosDate

        .toISOString()

        .slice(

          11,

          16,

        ),

  };

}







function normalizePhone(

  raw: string,

): string {

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







async function getOrCreatePartner(

  name: string,

  phone: string,

): Promise<number> {

  const partners =

    await odooCall<

      PartnerRecord[]

    >(

      "res.partner",

      "search_read",

      [

        [

          [

            "phone",

            "=",

            phone,

          ],

        ],

      ],

      {

        fields: [

          "id",

          "name",

          "phone",

        ],



        limit: 1,

      },

    );



  if (

    partners.length >

    0

  ) {

    const partner =

      partners[0];



    if (

      partner.name !==

      name

    ) {

      await odooCall<boolean>(

        "res.partner",

        "write",

        [

          [

            partner.id,

          ],



          {

            name,

          },

        ],

      );

    }



    return partner.id;

  }



  return odooCall<number>(

    "res.partner",

    "create",

    [

      {

        name,

        phone,

      },

    ],

  );

}







export async function getFamilyReservationSlots(
  partySize?: number,
): Promise<FamilyReservationSlot[]> {
  const events = await odooCall<CalendarEventRecord[]>(
    "calendar.event",
    "search_read",
    [
      [
        ["name", "ilike", PLACEHOLDER_NAME],
        ["appointment_status", "=", "request"],
      ],
    ],
    {
      fields: [
        "id",
        "name",
        "start",
        "stop",
        "resource_ids",
        "appointment_status",
      ],
      order: "start asc",
    },
  );

  const uniqueSlots = new Map<string, FamilyReservationSlot>();

  for (const event of events) {
    if (event.appointment_status !== "request") {
      continue;
    }

    if (
      !event.name
        .toLowerCase()
        .includes(PLACEHOLDER_NAME.toLowerCase())
    ) {
      continue;
    }

    const slot = fromOdooUtcDatetime(event.start);
    const resourceId = event.resource_ids?.[0];

    if (!isAllowedFamilySlot(slot.date, slot.time)) {
      continue;
    }

    if (!isAllowedFamilyResource(slot.date, resourceId)) {
      continue;
    }

    if (partySize && partySize > 0) {
      const capacity = resourceId
        ? TABLE_CAPACITY[resourceId]
        : undefined;

      if (!capacity || capacity < partySize) {
        continue;
      }
    }

    const key = `${slot.date}-${slot.time}`;
    uniqueSlots.set(key, slot);
  }

  return Array.from(uniqueSlots.values());
}



export async function createFamilyReservation(

  input: CreateFamilyReservationInput,

): Promise<CreateFamilyReservationResult> {

  try {

    const name =

      input.name.trim();



    const phone =

      normalizePhone(

        input.phone,

      );



    const partySize =

      Number(

        input.partySize,

      );



    const date =

      input.date.trim();



    const time =

      input.time.trim();



    if (!name) {

      return {

        success:

          false,



        error:

          "Name is required.",

      };

    }



    if (

      phone.replace(

        /\D/g,

        "",

      ).length < 9

    ) {

      return {

        success:

          false,



        error:

          "A valid phone number is required.",

      };

    }



    if (

      !Number.isInteger(

        partySize,

      ) ||

      partySize < 1 ||

      partySize > 4

    ) {

      return {

        success:

          false,



        error:

          "Reservations support 1 to 4 guests.",

      };

    }



    if (!isAllowedFamilySlot(date, time)) {
      return {
        success: false,
        error: "That reservation time is not available.",
      };
    }



    const start =

      toOdooUtcDatetime(

        date,

        time,

      );



    

    const candidates =

      await odooCall<

        CalendarEventRecord[]

      >(

        "calendar.event",

        "search_read",

        [

          [

            [

              "name",

              "ilike",

              PLACEHOLDER_NAME,

            ],



            [

              "start",

              "=",

              start,

            ],



            [

              "appointment_status",

              "=",

              "request",

            ],

          ],

        ],

        {

          fields: [

            "id",

            "name",

            "start",

            "stop",

            "resource_ids",

            "appointment_status",

          ],



          order:

            "id asc",

        },

      );



    if (

      candidates.length ===

      0

    ) {

      return {

        success:

          false,



        error:

          "That reservation time is no longer available.",

      };

    }



    const suitable = candidates
      .map((event) => {
        const resourceId = event.resource_ids?.[0];
        const capacity = resourceId
          ? TABLE_CAPACITY[resourceId]
          : undefined;

        return {
          event,
          resourceId,
          capacity,
        };
      })
      .filter(
        (
          item,
        ): item is {
          event: CalendarEventRecord;
          resourceId: number;
          capacity: number;
        } =>
          !!item.resourceId &&
          !!item.capacity &&
          isAllowedFamilyResource(date, item.resourceId) &&
          item.capacity >= partySize,
      )
      .sort((a, b) => a.capacity - b.capacity);



    if (

      suitable.length ===

      0

    ) {

      return {

        success:

          false,



        error:

          `No table is currently available for ${partySize} ${

            partySize === 1

              ? "guest"

              : "guests"

          } at that time.`,

      };

    }



    const selected =

      suitable[0];



    

    const freshRecords =

      await odooCall<

        CalendarEventRecord[]

      >(

        "calendar.event",

        "read",

        [

          [

            selected.event.id,

          ],



          [

            "id",

            "name",

            "start",

            "stop",

            "resource_ids",

            "appointment_status",

          ],

        ],

      );



    const freshEvent =

      freshRecords[0];



    if (

      !freshEvent ||

      freshEvent.appointment_status !==

        "request" ||

      !freshEvent.name

        .toLowerCase()

        .includes(

          PLACEHOLDER_NAME.toLowerCase(),

        )

    ) {

      return {

        success:

          false,



        error:

          "That table was just taken. Please choose another available time.",

      };

    }



    const partnerId =

      await getOrCreatePartner(

        name,

        phone,

      );



    const reservationCode =

      `FAM-${freshEvent.id}`;



    const metadata = {

      version: 1,



      reservationType:

        "family",



      code:

        reservationCode,



      name,



      phone,



      partySize,



      date,



      time,



      status:

        "confirmed",



      partnerId,



      eventIds: [

        freshEvent.id,

      ],



      resourceIds:

        freshEvent.resource_ids,



      createdAt:

        new Date()

          .toISOString(),

    };



    const eventName =

      `Family / ${name} / ${phone}`;



    const writeResult =

      await odooCall<boolean>(

        "calendar.event",

        "write",

        [

          [

            freshEvent.id,

          ],



          {

            name:

              eventName,



            appointment_status:

              "booked",



            appointment_booker_id:

              partnerId,



            phone_number:

              phone,



            [META_FIELD]:

              JSON.stringify(

                metadata,

              ),

          },

        ],

      );



    if (

      writeResult !==

      true

    ) {

      throw new Error(

        "Odoo did not confirm the reservation update.",

      );

    }



    

    const verification =

      await odooCall<

        CalendarEventRecord[]

      >(

        "calendar.event",

        "read",

        [

          [

            freshEvent.id,

          ],



          [

            "id",

            "name",

            "appointment_status",

            "appointment_booker_id",

            "phone_number",

            META_FIELD,

          ],

        ],

      );



    const savedEvent =

      verification[0];



    if (

      !savedEvent ||

      savedEvent.name !==

        eventName ||

      savedEvent.appointment_status !==

        "booked"

    ) {

      throw new Error(

        "Reservation was not saved correctly in Odoo.",

      );

    }



    console.log(

      "Family reservation saved to Odoo:",

      {

        eventId:

          savedEvent.id,



        name:

          savedEvent.name,



        status:

          savedEvent.appointment_status,



        reservationCode,

      },

    );



    

    let whatsappSent =

      false;



    try {

      const whatsappResult =

        await sendReservationConfirmationWhatsApp({

          name,

          phone,

          partySize,

          date,

          time,

          reservationCode,

        });



      whatsappSent =

        true;



      console.log(

        "Family reservation WhatsApp sent:",

        whatsappResult,

      );

    } catch (

      error

    ) {

      console.error(

        "Family reservation WhatsApp failed:",

        error,

      );

    }



    return {

      success:

        true,



      eventId:

        freshEvent.id,



      reservationCode,



      whatsappSent,

    };

  } catch (

    error

  ) {

    console.error(

      "createFamilyReservation failed:",

      error,

    );



    return {

      success:

        false,



      error:

        error instanceof Error

          ? error.message

          : "Unable to create reservation.",

    };

  }

}