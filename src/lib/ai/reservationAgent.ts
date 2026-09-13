import { GoogleGenAI, Content, FunctionCall } from '@google/genai';
import { checkAvailability } from '@/lib/reservations/availability';
import { createReservation } from '@/lib/reservations/tools';
import { getOperatingHours } from '@/lib/reservations/hours';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.AI_MODEL || 'gemini-3.7-flash';

const RESTAURANT_INFO = `
- Name: K's Kitchen Gourmet
- Cuisine: Indian restaurant and gourmet shop (honey, nuts, coffee, and more)
- Location: Turnbull Road, Lagos, Nigeria
- Takeaway: TODO — confirm yes/no and any conditions
- Delivery: TODO — confirm which platforms (e.g. Chowdeck, Glovo) or in-house
- Dine-in: yes, tables available via reservation or walk-in
- Contact: TODO — phone number / WhatsApp for the restaurant
- Parking: TODO
- Dress code: TODO — likely "casual", confirm
`;

const tools = [
  {
    functionDeclarations: [
      {
        name: 'check_reservation_availability',
        description:
          'Check whether a requested restaurant reservation is available. Always use this before telling the customer whether a requested reservation time is available.',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Reservation date in YYYY-MM-DD format.' },
            time: { type: 'string', description: 'Reservation start time in HH:MM 24-hour format. Example: 19:00 for 7 PM.' },
            party_size: { type: 'integer', description: 'Number of guests.' },
          },
          required: ['date', 'time', 'party_size'],
        },
      },
      {
        name: 'create_reservation',
        description:
          'Create a restaurant reservation. Only call this after the customer has explicitly confirmed that they want to proceed.',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Customer name.' },
            email: { type: 'string', description: 'Customer email address, if provided.' },
            phone: { type: 'string', description: 'Customer phone number, if provided.' },
            party_size: { type: 'integer', description: 'Number of guests.' },
            date: { type: 'string', description: 'Reservation date in YYYY-MM-DD format.' },
            time: { type: 'string', description: 'Reservation start time in HH:MM 24-hour format.' },
            note: { type: 'string', description: 'Optional customer note or special request.' },
          },
          required: ['name', 'party_size', 'date', 'time'],
        },
      },
      {
        name: 'get_operating_hours',
        description:
          'Get the restaurant\'s actual opening hours for a specific date or day of the week. Always use this when asked what time the restaurant is open, closes, or whether it is open on a given day — never guess or assume hours.',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'The date to check hours for, in YYYY-MM-DD format. If the customer asks generally, use today\'s date.',
            },
          },
          required: ['date'],
        },
      },
    ],
  },
];

function getCurrentLagosDateTime() {
  const now = new Date();
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(now);
  return { date, time };
}

function buildSystemInstruction() {
  const { date, time } = getCurrentLagosDateTime();
  return `
You are the assistant for K's Kitchen Gourmet — a warm, helpful restaurant assistant, not just a booking form. You can hold a normal conversation and answer general questions about the restaurant, as well as handle reservations.

CURRENT DATE AND TIME
The current date in Lagos, Nigeria is ${date}. The current time is ${time}. The restaurant timezone is Africa/Lagos.

WHAT YOU CAN HELP WITH
1. General questions about the restaurant — use RESTAURANT FACTS below. Don't invent details not listed there; say so honestly if unsure.
2. Opening hours — ALWAYS use get_operating_hours. Never state hours from memory.
3. Reservations — using check_reservation_availability and create_reservation.

RESTAURANT FACTS (use directly, no tool call needed)
${RESTAURANT_INFO}

DATE AND TIME HANDLING
- Always interpret dates using Africa/Lagos.
- Understand natural language dates ("today", "tomorrow", "next Saturday", "September 20").
- Convert relative dates into exact calendar dates before calling any tool needing a date.
- date MUST be YYYY-MM-DD, time MUST be HH:MM 24-hour when calling tools.
- Examples: "7pm" = "19:00", "8am" = "08:00".
- Only ask for clarification if the date is genuinely ambiguous or missing.

RESERVATION RULES
- Never decide availability yourself — always call check_reservation_availability first.
- Never invent availability or alternative times.
- The customer must explicitly confirm before create_reservation is called.
- Do not claim a reservation has been created unless create_reservation succeeds.

RESERVATION INFORMATION
Requires: customer name, party size, date, time. Email, phone, notes are optional.

FORMATTING
- Never use Markdown formatting of any kind — no **bold**, no _italics_, no bullet points with dashes or asterisks, no backticks, no headers. This text is displayed as-is in a plain chat bubble and sent as plain text over WhatsApp, so Markdown symbols show up as literal asterisks and clutter, not formatting.
- Write in plain, natural sentences and short paragraphs, the way you'd text a friend.
- When confirming details like a reservation summary, weave them into a natural sentence rather than a list.
  - Do NOT write: "**Name:** Joshua **Party Size:** 4 **Date:** Sept 15 **Time:** 7:00 PM"
  - DO write: "Just to confirm — that's a table for 4 under Joshua Johnson, Tuesday September 15th at 7:00 PM. Want me to lock that in?"
- If you need to mention a reservation ID or reference number, say it plainly in the sentence, not in a code block or backticks.

CONVERSATION STYLE
- Be conversational and natural — not every message is about booking a table.
- Answer general questions ("are you open now", "do you do takeout") directly, like a friendly host.
- Keep responses concise, warm, and natural.
`;
}

export type ChatHistoryItem = {
  role: 'user' | 'assistant' | 'model';
  content: string;
};

async function executeFunctionCall(call: FunctionCall): Promise<Record<string, unknown>> {
  const name = call.name;
  const args = call.args ?? {};

  if (!name) {
    return { success: false, error: 'Function name was not provided by Gemini.' };
  }

  try {
    switch (name) {
      case 'check_reservation_availability': {
        const result = await checkAvailability({
          date: String(args.date),
          time: String(args.time),
          partySize: Number(args.party_size),
        });
        return result as Record<string, unknown>;
      }
      case 'create_reservation': {
        const result = await createReservation({
          name: String(args.name),
          email: args.email ? String(args.email) : undefined,
          phone: args.phone ? String(args.phone) : undefined,
          party_size: Number(args.party_size),
          date: String(args.date),
          time: String(args.time),
          note: args.note ? String(args.note) : undefined,
        });
        return result as Record<string, unknown>;
      }
      case 'get_operating_hours': {
        const result = await getOperatingHours({ date: String(args.date) });
        return result as Record<string, unknown>;
      }
      default:
        return { success: false, error: `Unknown function: ${name}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }
}

function isRetryableGeminiError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { status?: number; message?: string };

  if (err.status === 503 || err.status === 429) return true;

  if (typeof err.message === 'string') {
    return /UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand/i.test(err.message);
  }

  return false;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateContentWithRetry(
  params: Parameters<typeof ai.models.generateContent>[0],
  maxAttempts = 3
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error) {
      lastError = error;

      if (!isRetryableGeminiError(error) || attempt === maxAttempts - 1) {
        throw error;
      }

      const baseDelay = 500 * Math.pow(2, attempt);
      const jitter = Math.random() * 250;
      const waitMs = Math.round(baseDelay + jitter);

      console.warn(
        `Gemini request failed (attempt ${attempt + 1}/${maxAttempts}), retrying in ${waitMs}ms:`,
        error
      );

      await delay(waitMs);
    }
  }

  throw lastError;
}

export async function runReservationAgent({
  message,
  history,
}: {
  message: string;
  history: ChatHistoryItem[];
}): Promise<{ reply: string }> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  try {
    const contents: Content[] = [];

    for (const item of history) {
      if (!item.content?.trim()) continue;
      const role = item.role === 'assistant' ? 'model' : item.role === 'model' ? 'model' : 'user';
      contents.push({ role, parts: [{ text: item.content }] });
    }

    contents.push({ role: 'user', parts: [{ text: message }] });

    let response = await generateContentWithRetry({
      model: MODEL,
      config: { systemInstruction: buildSystemInstruction(), tools },
      contents,
    });

    for (let iteration = 0; iteration < 5; iteration++) {
      const functionCalls = response.functionCalls ?? [];
      if (functionCalls.length === 0) break;

      const modelContent = response.candidates?.[0]?.content;
      if (modelContent) contents.push(modelContent);

      const functionResponseParts = [];
      for (const call of functionCalls) {
        const result = await executeFunctionCall(call);
        functionResponseParts.push({
          functionResponse: {
            name: call.name ?? 'unknown_function',
            response: result,
            ...(call.id ? { id: call.id } : {}),
          },
        });
      }

      contents.push({ role: 'user', parts: functionResponseParts });

      response = await generateContentWithRetry({
        model: MODEL,
        config: { systemInstruction: buildSystemInstruction(), tools },
        contents,
      });

      if (iteration === 4 && (response.functionCalls ?? []).length > 0) {
        return {
          reply: "Sorry, I'm having trouble finishing that request — let me get someone from the team to help.",
        };
      }
    }

    const text = response.text?.trim() || 'Sorry, I was unable to process that request.';
    return { reply: text };
  } catch (error) {
    console.error('runReservationAgent failed:', error);

    if (isRetryableGeminiError(error)) {
      return {
        reply:
          "We're getting a lot of requests right now — could you try sending that again in just a moment? Sorry for the wait!",
      };
    }

    throw error;
  }
}