import crypto from 'crypto';

export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return false;

  const expected =
    'sha256=' +
    crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}   