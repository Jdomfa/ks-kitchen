import { createServiceClient } from '@/lib/supabase/service';
import { deleteReservationFromOdoo } from '@/lib/odoo/client';

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

export async function cancelReservationByCode(code: string) {
  const supabase = createServiceClient();

  /*
   * Fetch the linked Odoo event ID before cancelling — the RPC's
   * own response doesn't include it, and matching the same
   * upper/trim normalization the RPC uses internally so this finds
   * the same row it's about to cancel.
   */
  const { data: existing } = await supabase
    .from('reservations')
    .select('odoo_event_id')
    .eq('reservation_code', code.trim().toUpperCase())
    .maybeSingle();

  const { data, error } = await supabase.rpc('cancel_reservation_atomic', {
    p_code: code,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = data as { success: boolean; error?: string };

  if (result.success && existing?.odoo_event_id) {
    deleteReservationFromOdoo(existing.odoo_event_id).catch((err) => {
      console.error('Failed to delete cancelled reservation from Odoo:', err);
    });
  }

  return result;
}