import crypto from 'crypto';

export function verifyWhatsAppSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret || !signature) {
    return false;
  }

  const expectedSignature =
    'sha256=' +
    crypto
      .createHmac('sha256', appSecret)
      .update(rawBody, 'utf8')
      .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch {
    return false;
  }
}