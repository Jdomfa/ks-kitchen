'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const VALID_STATUSES = new Set([
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
]);

// ── Create Reservation ───────────────────────────────────────

export async function createReservation(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim() || null;
  const phone = String(formData.get('phone') || '').trim() || null;
  const party_size = Number(formData.get('party_size') || 0);
  const reservation_date = String(formData.get('reservation_date') || '');
  const reservation_time = String(formData.get('reservation_time') || '');
  const note = String(formData.get('note') || '').trim() || null;
  const status = String(formData.get('status') || 'pending');

  const { error } = await supabase.from('reservations').insert({
    name,
    email,
    phone,
    party_size,
    reservation_date,
    reservation_time,
    note,
    status,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/reservations');
}

// ── Update Reservation ───────────────────────────────────────

export async function updateReservation(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get('id'));
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim() || null;
  const phone = String(formData.get('phone') || '').trim() || null;
  const party_size = Number(formData.get('party_size') || 0);
  const reservation_date = String(formData.get('reservation_date') || '');
  const reservation_time = String(formData.get('reservation_time') || '');
  const note = String(formData.get('note') || '').trim() || null;
  const status = String(formData.get('status') || 'pending');

  const { error } = await supabase
    .from('reservations')
    .update({
      name,
      email,
      phone,
      party_size,
      reservation_date,
      reservation_time,
      note,
      status,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/reservations');
}

// ── Update Reservation Status ────────────────────────────────

export async function updateReservationStatus(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get('id') || '');
  const status = String(formData.get('status') || '');

  if (!id) {
    throw new Error('Reservation ID is required.');
  }

  if (!VALID_STATUSES.has(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const { error, data } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', id)
    .select('id');

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) {
    throw new Error(
      'Update affected 0 rows. This usually means a Row Level Security policy is blocking this write.'
    );
  }

  revalidatePath('/dashboard/reservations');
}


// ── Delete Reservation ───────────────────────────────────────

export async function deleteReservation(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get('id') || '');

  if (!id) {
    throw new Error('Reservation ID is required.');
  }

  const { error, data } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) {
    throw new Error(
      'Delete affected 0 rows. This usually means a Row Level Security policy is blocking this write.'
    );
  }

  revalidatePath('/dashboard/reservations');
}