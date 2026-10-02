'use server';

import { createServiceClient } from '@/lib/supabase/service';

export async function submitFeedback(args: {
  rating: number;
  orderNotes?: string;
  comment?: string;
  name?: string;
  phone?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!args.rating || args.rating < 1 || args.rating > 5) {
    return { success: false, error: 'A rating is required.' };
  }

  const supabase = createServiceClient();

  const { error } = await supabase.from('feedback').insert({
    rating: args.rating,
    order_notes: args.orderNotes?.trim() || null,
    comment: args.comment?.trim() || null,
    name: args.name?.trim() || null,
    phone: args.phone?.trim() || null,
  });

  if (error) {
    console.error('Feedback insert failed:', error);
    return { success: false, error: 'Something went wrong — please try again.' };
  }

  return { success: true };
}