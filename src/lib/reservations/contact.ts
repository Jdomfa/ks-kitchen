// Single source of truth for restaurant contact details.
// Update these once real values are confirmed — everywhere else
// (this page, the AI system prompt, WhatsApp links) should import
// from here rather than hardcoding the number separately.

export const RESTAURANT_PHONE_DISPLAY = '+234 000 000 0000'; // TODO: real number
export const RESTAURANT_PHONE_TEL = '+2340000000000'; // TODO: same number, tel:-safe format
export const RESTAURANT_WHATSAPP_NUMBER = '2340000000000'; // TODO: WhatsApp number, no + or spaces

export const WHATSAPP_LINK = `https://wa.me/${RESTAURANT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi, I'd like to book a table"
)}`;