import { createServiceClient } from '@/lib/supabase/service';

/**
 * Returns true if the request is allowed, false if the identifier
 * has exceeded maxCount within windowSeconds.
 *
 * Fails open (allows the request) if the check itself errors, so an
 * infra hiccup never blocks legitimate customers.
 */
export async function checkRateLimit(
  key: string,
  maxCount: number,
  windowSeconds: number
): Promise<boolean> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_max_count: maxCount,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error('Rate limit check failed:', error.message);
    return true;
  }

  return data as boolean;
}