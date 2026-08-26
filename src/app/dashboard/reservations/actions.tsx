'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// ── Reservations ─────────────────────────────────────────────

export async function createReservation(formData: FormData) {
    const supabase = await createClient();

    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim() || null;
    const phone = String(formData.get('phone') || '').trim() || null;
    const party_size = Number(formData.get('party_size') || 0);
    const reservation_date = String(
        formData.get('reservation_date') || ''
    );
    const reservation_time = String(
        formData.get('reservation_time') || ''
    );
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

// ── Update Reservation ──────────────────────────────────────

export async function updateReservation(formData: FormData) {
    const supabase = await createClient();

    const id = String(formData.get('id'));

    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim() || null;
    const phone = String(formData.get('phone') || '').trim() || null;
    const party_size = Number(formData.get('party_size') || 0);
    const reservation_date = String(
        formData.get('reservation_date') || ''
    );
    const reservation_time = String(
        formData.get('reservation_time') || ''
    );
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

// ── Update Reservation Status ───────────────────────────────

export async function updateReservationStatus(
    formData: FormData
) {
    const supabase = await createClient();

    const id = String(formData.get('id'));
    const status = String(formData.get('status'));

    const { error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/reservations');
}

// ── Delete Reservation ──────────────────────────────────────

export async function deleteReservation(formData: FormData) {
    const supabase = await createClient();

    const id = String(formData.get('id'));

    const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/reservations');
}