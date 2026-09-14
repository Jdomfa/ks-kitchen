import { createServiceClient } from '@/lib/supabase/service';

export type SlotAvailability = {
  slot_time: string; // "HH:MM:SS" as returned by Postgres
  available_covers: number;
  booked_covers: number;
};

export async function getSlotAvailability(date: string): Promise<SlotAvailability[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc('get_slot_availability', {
    p_date: date,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SlotAvailability[];
}

export async function createSlotReservation(args: {
  name: string;
  phone?: string;
  party_size: number;
  date: string;
  time: string;
}) {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc('create_slot_reservation_atomic', {
    p_name: args.name,
    p_phone: args.phone ?? null,
    p_party_size: args.party_size,
    p_reservation_date: args.date,
    p_reservation_time: args.time,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
export async function modifySlotReservation(
  code: string,
  date: string,
  time: string
) {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc('modify_slot_reservation_atomic', {
    p_code: code,
    p_new_date: date,
    p_new_time: time,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}