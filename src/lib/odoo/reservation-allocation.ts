const ODOO_URL = process.env.ODOO_URL!;

const ODOO_DB = process.env.ODOO_DB!;

const ODOO_USERNAME = process.env.ODOO_USERNAME!;

const ODOO_API_KEY = process.env.ODOO_API_KEY!;



const LAGOS_UTC_OFFSET_HOURS = 1;



const DEFAULT_PARTNER_ID = Number(

  process.env.ODOO_DEFAULT_PARTNER_ID ?? 3

);



const PUBLIC_PLACEHOLDER_NAME =

  "Public Placeholder";



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



async function odooCall<T>(

  model: string,

  method: string,

  args: unknown[],

  kwargs: Record<string, unknown> = {}

): Promise<T> {

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

          await getUid(),

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

    (await res.json()) as JsonRpcResult<T>;



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

    (await res.json()) as JsonRpcResult<number>;



  if (!data.result) {

    throw new Error(

      "Odoo authentication failed — check ODOO_DB, ODOO_USERNAME, and ODOO_API_KEY."

    );

  }



  cachedUid = data.result;



  return cachedUid;

}



function toOdooUtcDatetime(

  date: string,

  time: string

): string {

  const [hours, minutes] = time

    .split(":")

    .map(Number);



  if (

    !Number.isInteger(hours) ||

    !Number.isInteger(minutes)

  ) {

    throw new Error(

      `Invalid time value: "${time}"`

    );

  }



  const dt = new Date(

    `${date}T00:00:00Z`

  );



  if (Number.isNaN(dt.getTime())) {

    throw new Error(

      `Invalid date value: "${date}"`

    );

  }



  const utcHours =

    hours - LAGOS_UTC_OFFSET_HOURS;



  dt.setUTCHours(

    utcHours,

    minutes,

    0,

    0

  );



  return dt

    .toISOString()

    .slice(0, 19)

    .replace("T", " ");

}



/* ============================================================

 * Types

 * ========================================================== */



export type PlaceholderOption = {

  eventId: number;

  label: string;



  resourceId?: number;

  resourceName?: string;



  capacity: number;

};



export type Placeholder = {

  id: number;



  name: string;



  start: string;

  stop: string;



  capacity: number;

  available: boolean;



  partnerId: number | false;



  resourceId?: number;

  resourceName?: string;



  /**

   * Native Odoo Appointment values.

   *

   * Keep these available for the dashboard/debugging while

   * we decide whether they should replace the Studio fields.

   */

  appointmentStatus?: string | false;



  availableCapacity?: number;



  totalCapacityReserved?: number;



  totalCapacityUsed?: number;



  bookingLineIds?: number[];

};



type CalendarEventRecord = {

  id: number;



  name: string;



  start: string;

  stop: string;



  partner_id:

    | [number, string]

    | false;



  /**

   * Both of these were confirmed on your Odoo instance.

   */

  resource_ids: number[];



  appointment_resource_ids: number[];



  booking_line_ids: number[];



  appointment_status:

    | string

    | false;



  available_capacity:

    | number

    | false;



  total_capacity_reserved:

    | number

    | false;



  total_capacity_used:

    | number

    | false;



  x_studio_slot_capacity:

    | number

    | false;



  x_studio_slot_avalability:

    | boolean

    | false;

};



type AppointmentResourceRecord = {

  id: number;

  name: string;

};



/* ============================================================

 * Resource helpers

 * ========================================================== */



async function getAppointmentResources(

  resourceIds: number[]

): Promise<

  Map<number, AppointmentResourceRecord>

> {

  if (resourceIds.length === 0) {

    return new Map();

  }



  const resources =

    await odooCall<

      AppointmentResourceRecord[]

    >(

      "appointment.resource",

      "read",

      [

        resourceIds,

        [

          "id",

          "name",

        ],

      ]

    );



  return new Map(

    resources.map((resource) => [

      resource.id,

      resource,

    ])

  );

}



function getPrimaryResourceId(

  record: Pick<

    CalendarEventRecord,

    | "resource_ids"

    | "appointment_resource_ids"

  >

): number | undefined {

  /**

   * resource_ids is the direct relation we want to use

   * for grouping/display.

   *

   * appointment_resource_ids is kept as a fallback because

   * your event currently has both populated with the same id.

   */

  return (

    record.resource_ids?.[0] ??

    record.appointment_resource_ids?.[0]

  );

}



/* ============================================================

 * Get all placeholders

 * ========================================================== */



export async function getAllPlaceholders(): Promise<

  Placeholder[]

> {

  const records =

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

            PUBLIC_PLACEHOLDER_NAME,

          ],

        ],



        [

          "id",

          "name",

          "start",

          "stop",



          "partner_id",



          "resource_ids",

          "appointment_resource_ids",



          "booking_line_ids",



          "appointment_status",



          "available_capacity",

          "total_capacity_reserved",

          "total_capacity_used",



          "x_studio_slot_capacity",

          "x_studio_slot_avalability",

        ],

      ],



      {

        order: "start asc",

      }

    );



  /**

   * Collect all unique Appointment resource ids.

   */

  const resourceIds =

    Array.from(

      new Set(

        records.flatMap(

          (record) => [

            ...(record.resource_ids ?? []),



            ...(

              record.appointment_resource_ids ??

              []

            ),

          ]

        )

      )

    );



  /**

   * Resolve ids such as:

   *

   * 3 -> "Table 3"

   */

  const resourceMap =

    await getAppointmentResources(

      resourceIds

    );



  return records.map((record) => {

    const resourceId =

      getPrimaryResourceId(record);



    const resource =

      resourceId

        ? resourceMap.get(resourceId)

        : undefined;



    return {

      id: record.id,



      name:

        record.name ||

        `Calendar Event ${record.id}`,



      start: record.start,

      stop: record.stop,



      /**

       * Keep your current Studio field behavior for now.

       *

       * We will revisit this because your inspected record

       * currently has Studio capacity = 0 while Odoo native

       * available_capacity = 30.

       */

      capacity:

        typeof record.x_studio_slot_capacity ===

        "number"

          ? record.x_studio_slot_capacity

          : 0,



      available:

        record.x_studio_slot_avalability ===

        true,



      partnerId:

        record.partner_id

          ? record.partner_id[0]

          : false,



      resourceId,



      resourceName:

        resource?.name,



      appointmentStatus:

        record.appointment_status,



      availableCapacity:

        typeof record.available_capacity ===

        "number"

          ? record.available_capacity

          : 0,



      totalCapacityReserved:

        typeof record.total_capacity_reserved ===

        "number"

          ? record.total_capacity_reserved

          : 0,



      totalCapacityUsed:

        typeof record.total_capacity_used ===

        "number"

          ? record.total_capacity_used

          : 0,



      bookingLineIds:

        record.booking_line_ids ?? [],

    };

  });

}



/* ============================================================

 * Find available placeholders

 * ========================================================== */



export async function findAvailablePlaceholders(

  date: string,

  time: string,

  partySize: number

): Promise<PlaceholderOption[]> {

  if (

    !Number.isInteger(partySize) ||

    partySize <= 0

  ) {

    throw new Error(

      "partySize must be a positive integer."

    );

  }



  const start =

    toOdooUtcDatetime(date, time);



  const records =

    await odooCall<

      {

        id: number;



        name: string;



        resource_ids: number[];



        appointment_resource_ids: number[];



        x_studio_slot_capacity:

          | number

          | false;

      }[]

    >(

      "calendar.event",

      "search_read",



      [

        [

          [

            "name",

            "ilike",

            PUBLIC_PLACEHOLDER_NAME,

          ],



          [

            "start",

            "=",

            start,

          ],



          [

            "x_studio_slot_avalability",

            "=",

            true,

          ],



          [

            "x_studio_slot_capacity",

            ">=",

            partySize,

          ],

        ],



        [

          "id",

          "name",



          "resource_ids",

          "appointment_resource_ids",



          "x_studio_slot_capacity",

        ],

      ],



      {

        order:

          "x_studio_slot_capacity asc, id asc",

      }

    );



  const resourceIds =

    Array.from(

      new Set(

        records.flatMap(

          (record) => [

            ...(record.resource_ids ?? []),



            ...(

              record.appointment_resource_ids ??

              []

            ),

          ]

        )

      )

    );



  const resourceMap =

    await getAppointmentResources(

      resourceIds

    );



  return records.map((record) => {

    const resourceId =

      record.resource_ids?.[0] ??

      record.appointment_resource_ids?.[0];



    return {

      eventId: record.id,



      label:

        record.name ||

        `${PUBLIC_PLACEHOLDER_NAME} ${record.id}`,



      resourceId,



      resourceName:

        resourceId

          ? resourceMap.get(

              resourceId

            )?.name

          : undefined,



      capacity:

        typeof record.x_studio_slot_capacity ===

        "number"

          ? record.x_studio_slot_capacity

          : 0,

    };

  });

}



/* ============================================================

 * Claim placeholder

 * ========================================================== */



export async function claimPlaceholder(

  eventId: number,

  details: {

    name: string;

    phone?: string;

    partySize: number;

    reservationCode?: string;

  }

): Promise<{

  success: boolean;

  error?: string;

}> {

  if (

    !Number.isInteger(eventId) ||

    eventId <= 0

  ) {

    return {

      success: false,

      error:

        "Invalid Odoo event id.",

    };

  }



  if (!details.name.trim()) {

    return {

      success: false,

      error:

        "Customer name is required.",

    };

  }



  if (

    !Number.isInteger(

      details.partySize

    ) ||

    details.partySize <= 0

  ) {

    return {

      success: false,



      error:

        "Party size must be a positive integer.",

    };

  }



  /**

   * Re-check immediately before claiming.

   */

  const [current] =

    await odooCall<

      {

        id: number;

        name: string;



        x_studio_slot_avalability:

          | boolean

          | false;



        x_studio_slot_capacity:

          | number

          | false;

      }[]

    >(

      "calendar.event",

      "read",



      [

        [eventId],



        [

          "id",

          "name",

          "x_studio_slot_avalability",

          "x_studio_slot_capacity",

        ],

      ]

    );



  if (!current) {

    return {

      success: false,



      error:

        "The selected reservation slot no longer exists.",

    };

  }



  if (

    !current.name

      .toLowerCase()

      .includes(

        PUBLIC_PLACEHOLDER_NAME.toLowerCase()

      )

  ) {

    return {

      success: false,

      error:

        "That reservation slot is not a public placeholder.",

    };

  }



  if (

    current.x_studio_slot_avalability !==

    true

  ) {

    return {

      success: false,



      error:

        "That reservation slot was just taken by someone else.",

    };

  }



  const capacity =

    typeof current.x_studio_slot_capacity ===

    "number"

      ? current.x_studio_slot_capacity

      : 0;



  if (

    capacity <

    details.partySize

  ) {

    return {

      success: false,



      error:

        `This slot only supports ${capacity} guest` +

        `${capacity === 1 ? "" : "s"}.`,

    };

  }



  const displayName =

    `Table Reservation — ${details.name.trim()}` +

    (

      details.reservationCode

        ? ` [${details.reservationCode}]`

        : ""

    );



  await odooCall<boolean>(

    "calendar.event",

    "write",



    [

      [eventId],



      {

        x_studio_slot_avalability:

          false,



        name: displayName,



        partner_id:

          DEFAULT_PARTNER_ID,

      },

    ]

  );



  return {

    success: true,

  };

}