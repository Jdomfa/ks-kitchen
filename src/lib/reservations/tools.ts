import { createServiceClient } from '@/lib/supabase/service';
import { checkAvailability } from './availability';

export async function checkReservationAvailability(args: {
  date: string;
  time: string;
  party_size: number;
}) {
  return checkAvailability({
    date: args.date,
    time: args.time,
    partySize: args.party_size,
  });
}

export async function createReservation(args: {
  name: string;
  email?: string;
  phone?: string;
  party_size: number;
  date: string;
  time: string;
  note?: string;
}) {
  const supabase = await createServiceClient();

  /*
   * The database function performs the final availability
   * check and insertion atomically.
   */

  const { data, error } = await supabase.rpc(
    'create_reservation_atomic',
    {
      p_name: args.name,
      p_email: args.email ?? null,
      p_phone: args.phone ?? null,
      p_party_size: args.party_size,
      p_reservation_date: args.date,
      p_reservation_time: args.time,
      p_note: args.note ?? null,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getReservationByCode(code: string) {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc('get_reservation_by_code', {
    p_code: code,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function cancelReservationByCode(code: string) {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc('cancel_reservation_atomic', {
    p_code: code,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function modifyReservationByCode(
  code: string,
  date: string,
  time: string
) {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc('modify_reservation_atomic', {
    p_code: code,
    p_new_date: date,
    p_new_time: time,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getReservationByPhone(phone: string) {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc('get_reservation_by_phone', {
    p_phone: phone,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}