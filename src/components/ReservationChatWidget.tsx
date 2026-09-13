'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type FlowButton = { id: string; title: string; url?: string };
type SummaryRow = { label: string; value: string };

type FlowState = {
  step: string;
  draft: Record<string, unknown>;
  alternatives?: string[];
};

type Screen = {
  reply: string;
  buttons?: FlowButton[];
  inputType?: 'date';
  summary?: SummaryRow[];
  session: FlowState;
};

const INITIAL_SESSION: FlowState = { step: 'MAIN_MENU', draft: {} };

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.02 3C9.4 3 4 8.37 4 15c0 2.36.68 4.56 1.86 6.42L4 29l7.77-1.83A11.9 11.9 0 0 0 16.02 27C22.63 27 28 21.63 28 15S22.63 3 16.02 3Zm0 21.7c-1.98 0-3.83-.55-5.4-1.5l-.39-.23-4.61 1.09 1.13-4.5-.25-.4A9.63 9.63 0 0 1 5.3 15c0-5.9 4.8-10.7 10.72-10.7S26.74 9.1 26.74 15 21.94 24.7 16.02 24.7Zm5.86-8.02c-.32-.16-1.9-.94-2.2-1.04-.29-.1-.5-.16-.72.16-.21.32-.82 1.04-1.01 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.6-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.75-.99-2.4-.26-.62-.53-.54-.72-.55h-.62c-.21 0-.56.08-.85.4-.29.32-1.12 1.1-1.12 2.68 0 1.58 1.15 3.1 1.31 3.32.16.21 2.26 3.5 5.5 4.9.77.33 1.37.53 1.84.68.77.24 1.47.21 2.03.13.62-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.14-.29-.21-.61-.37Z" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-6h2v6a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function isWhatsAppUrl(url?: string) {
  return !!url && url.includes('wa.me');
}

export default function ReservationChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [screenIndex, setScreenIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [direction, setDirection] = useState(1);

  const inputRef = useRef<HTMLInputElement>(null);

  const currentScreen = screens[screenIndex];
  const isAtMainMenu = currentScreen?.session.step === 'MAIN_MENU';

  useEffect(() => {
    function handleOpenChat() {
      setIsOpen(true);
    }
    window.addEventListener('kk:open-chat', handleOpenChat);
    return () => window.removeEventListener('kk:open-chat', handleOpenChat);
  }, []);

  useEffect(() => {
    if (isOpen && !hasLoaded) {
      setHasLoaded(true);
      loadGreeting();
    }
  }, [isOpen, hasLoaded]);

  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!currentScreen?.buttons) {
      inputRef.current?.focus();
    }
  }, [screenIndex]);

  async function loadGreeting() {
    setIsSending(true);
    try {
      const res = await fetch('/api/ai/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '', session: INITIAL_SESSION }),
      });
      const data = await res.json();

      setScreens([
        {
          reply: data.message,
          buttons: data.buttons,
          inputType: data.inputType,
          summary: data.summary,
          session: data.session ?? INITIAL_SESSION,
        },
      ]);
      setScreenIndex(0);
    } catch (err) {
      console.error('Greeting fetch error:', err);
      setScreens([
        {
          reply: "Hi! Welcome to K's Kitchen. How can I help?",
          session: INITIAL_SESSION,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function advance(rawValue: string, buttonId?: string) {
    if (isSending) return;
    if (!buttonId && !rawValue.trim()) return;

    setError(null);
    setIsSending(true);
    setDirection(1);

    try {
      const res = await fetch('/api/ai/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: buttonId ?? rawValue.trim(),
          session: currentScreen.session,
        }),
      });

      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

      const data = await res.json();

      const nextScreen: Screen = {
        reply: data.message,
        buttons: data.buttons,
        inputType: data.inputType,
        summary: data.summary,
        session: data.session ?? currentScreen.session,
      };

      setScreens((prev) => [...prev.slice(0, screenIndex + 1), nextScreen]);
      setScreenIndex((i) => i + 1);
      setInputValue('');
    } catch (err) {
      console.error('Chat widget error:', err);
      setError('Something went wrong. Please try again, or call us directly.');
    } finally {
      setIsSending(false);
    }
  }

  function goBack() {
    if (screenIndex === 0) return;
    setDirection(-1);
    setInputValue('');
    setScreenIndex((i) => i - 1);
  }

  function goToMainMenu() {
    advance('0');
  }

  function handleButtonClick(button: FlowButton) {
    if (button.url) {
      window.open(button.url, '_blank', 'noopener,noreferrer');
      return;
    }
    advance('', button.id);
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    advance(inputValue);
  }

  function handleClose() {
    setIsOpen(false);
    setScreens([]);
    setScreenIndex(0);
    setHasLoaded(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-terracotta text-coconut-cream shadow-lg transition hover:bg-tamarind-bark"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-coconut-cream"
            style={{ height: '100dvh' }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between bg-terracotta px-5 py-4">
              <div className="flex items-center gap-3">
                {screenIndex > 0 && (
                  <button
                    onClick={goBack}
                    aria-label="Back"
                    className="rounded-full p-1 text-coconut-cream/80 transition hover:bg-tamarind-bark hover:text-coconut-cream"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
                <div>
                  <p className="text-sm font-semibold text-coconut-cream">K's Kitchen Gourmet</p>
                  <p className="text-xs text-coconut-cream/80">Reservations & questions</p>
                </div>
              </div>

              <button
                onClick={handleClose}
                aria-label="Close chat"
                className="rounded-full p-1 text-coconut-cream/80 transition hover:bg-tamarind-bark hover:text-coconut-cream"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Screen content */}
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                {currentScreen && (
                  <motion.div
                    key={screenIndex}
                    custom={direction}
                    initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="absolute inset-0 flex flex-col overflow-y-auto px-6 py-8"
                  >
                    <p className="whitespace-pre-line text-lg leading-relaxed text-roasted-coffee">
                      {currentScreen.reply}
                    </p>

                    {currentScreen.summary && (
                      <div className="mt-6 overflow-hidden rounded-2xl border border-clay-pot/20 bg-white shadow-sm">
                        {currentScreen.summary.map((row, i) => (
                          <div
                            key={row.label}
                            className={`flex items-center justify-between px-5 py-3.5 ${
                              i !== currentScreen.summary!.length - 1 ? 'border-b border-clay-pot/10' : ''
                            }`}
                          >
                            <span className="text-xs font-medium uppercase tracking-wide text-roasted-coffee/50">
                              {row.label}
                            </span>
                            <span className="text-sm font-semibold text-roasted-coffee">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-8 flex-1">
                      {currentScreen.buttons && currentScreen.buttons.length > 0 ? (
                        <div className="space-y-3">
                          {currentScreen.buttons.map((button) => (
                            <button
                              key={button.id}
                              onClick={() => handleButtonClick(button)}
                              disabled={isSending}
                              className="flex w-full items-center gap-3 rounded-xl border border-clay-pot/30 bg-white px-5 py-4 text-left text-base font-medium text-roasted-coffee shadow-sm transition hover:border-clay-pot hover:bg-clay-pot/5 disabled:opacity-50"
                            >
                              {isWhatsAppUrl(button.url) && (
                                <WhatsAppIcon className="h-5 w-5 shrink-0 text-[#25D366]" />
                              )}
                              {button.title}
                            </button>
                          ))}
                        </div>
                      ) : currentScreen.inputType === 'date' ? (
                        <form onSubmit={handleTextSubmit} className="space-y-4">
                          <input
                            type="date"
                            value={inputValue}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full min-w-0 rounded-xl border border-tamarind-bark/20 px-4 py-3 text-base text-roasted-coffee outline-none focus:border-brushed-brass"
                            style={{
                              WebkitAppearance: 'none',
                              appearance: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                          <button
                            type="submit"
                            disabled={isSending || !inputValue}
                            className="w-full rounded-xl bg-clay-pot px-5 py-3 text-base font-medium text-coconut-cream transition hover:bg-terracotta disabled:opacity-40"
                          >
                            Continue
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleTextSubmit} className="space-y-4">
                          <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your answer..."
                            disabled={isSending}
                            className="w-full min-w-0 rounded-xl border border-tamarind-bark/20 px-4 py-3 text-base text-roasted-coffee outline-none focus:border-brushed-brass disabled:opacity-60"
                            style={{ boxSizing: 'border-box' }}
                          />
                          <button
                            type="submit"
                            disabled={isSending || !inputValue.trim()}
                            className="w-full rounded-xl bg-clay-pot px-5 py-3 text-base font-medium text-coconut-cream transition hover:bg-terracotta disabled:opacity-40"
                          >
                            Send
                          </button>
                        </form>
                      )}
                    </div>

                    {error && (
                      <p className="mt-4 text-sm text-terracotta" role="alert">
                        {error}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {isSending && !currentScreen && (
                <div className="flex h-full items-center justify-center">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-tamarind-bark/50 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-tamarind-bark/50 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-tamarind-bark/50" />
                  </div>
                </div>
              )}
            </div>

            {/* Persistent bottom nav — only shown once away from the main menu */}
            {!isAtMainMenu && currentScreen && (
              <div className="shrink-0 border-t border-roasted-coffee/10 bg-white px-5 py-3">
                <button
                  onClick={goToMainMenu}
                  disabled={isSending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-roasted-coffee/5 px-5 py-3.5 text-base font-medium text-roasted-coffee transition hover:bg-roasted-coffee/10 disabled:opacity-50"
                >
                  <HomeIcon className="h-5 w-5" />
                  Main menu
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}