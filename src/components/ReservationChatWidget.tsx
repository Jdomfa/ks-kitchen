'use client';

import { useEffect, useRef, useState } from 'react';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type FlowState = {
  step: string;
  draft: Record<string, unknown>;
  alternatives?: string[];
};

const INITIAL_SESSION: FlowState = { step: 'MAIN_MENU', draft: {} };

export default function ReservationChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<FlowState>(INITIAL_SESSION);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedGreeting, setHasLoadedGreeting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    function handleOpenChat() {
      setIsOpen(true);
    }
    window.addEventListener('kk:open-chat', handleOpenChat);
    return () => window.removeEventListener('kk:open-chat', handleOpenChat);
  }, []);

  // Fetch the real menu from the API the first time the widget opens,
  // instead of showing a hardcoded greeting that could drift from the
  // actual flow logic.
  useEffect(() => {
    if (isOpen && !hasLoadedGreeting) {
      setHasLoadedGreeting(true);
      fetchGreeting();
    }
  }, [isOpen, hasLoadedGreeting]);

  async function fetchGreeting() {
    setIsSending(true);
    try {
      const res = await fetch('/api/ai/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '', session: INITIAL_SESSION }),
      });

      const data = await res.json();

      setMessages([{ role: 'assistant', content: data.message }]);
      if (data.session) setSession(data.session);
    } catch (err) {
      console.error('Greeting fetch error:', err);
      setMessages([
        {
          role: 'assistant',
          content: "Hi! Welcome to K's Kitchen. How can I help?",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setError(null);
    setInput('');

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          session,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();
      const reply: string =
        typeof data.message === 'string'
          ? data.message
          : "Sorry, I wasn't able to process that. Please try again.";

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      if (data.session) setSession(data.session);
    } catch (err) {
      console.error('Chat widget error:', err);
      setError('Something went wrong. Please try again, or call us directly.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "Sorry, I'm having trouble responding right now. Please try again in a moment or contact the restaurant directly.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-3 flex h-[520px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-brushed-brass/30 bg-coconut-cream shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-terracotta px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-coconut-cream">K's Kitchen Gourmet</p>
              <p className="text-xs text-coconut-cream/80">Reservations & questions</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1 text-coconut-cream/80 transition hover:bg-tamarind-bark hover:text-coconut-cream"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            aria-live="polite"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-clay-pot text-coconut-cream'
                      : 'border border-curry-leaf/20 bg-white text-roasted-coffee'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl border border-curry-leaf/20 bg-white px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-tamarind-bark/50 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-tamarind-bark/50 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-tamarind-bark/50" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <p className="px-4 pb-1 text-xs text-terracotta" role="alert">
              {error}
            </p>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 border-t border-brushed-brass/20 bg-white p-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a table, hours, takeaway..."
              disabled={isSending}
              className="flex-1 rounded-full border border-tamarind-bark/20 px-3 py-2 text-base text-roasted-coffee outline-none focus:border-brushed-brass disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-pot text-coconut-cream transition hover:bg-terracotta disabled:opacity-40"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Launcher button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-terracotta text-coconut-cream shadow-lg transition hover:bg-tamarind-bark"
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}