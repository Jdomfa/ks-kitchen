"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";

type FlowButton = {
  id: string;
  title: string;
  url?: string;
};

type SummaryRow = {
  label: string;
  value: string;
};

type FlowState = {
  step: string;
  draft: Record<string, unknown>;
  alternatives?: string[];
  manageCode?: string;
  managePartySize?: number;
  manageName?: string;
  managePhone?: string;
};

type Screen = {
  reply: string;
  buttons?: FlowButton[];
  inputType?: "date";
  summary?: SummaryRow[];
  session: FlowState;
};

type ReservationApiResponse = {
  message?: string;
  buttons?: FlowButton[];
  inputType?: "date";
  summary?: SummaryRow[];
  session?: FlowState;
};

const MANAGE_SESSION: FlowState = {
  step: "MANAGE_CODE",
  draft: {},
};

function getLagosTodayISO(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function addDaysToISO(dateISO: string, days: number): string {
  const date = new Date(`${dateISO}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatBookingDateLabel(dateISO: string, suffix?: string): string {
  const [year, month, day] = dateISO.split("-").map(Number);

  if (!year || !month || !day) return dateISO;

  const label = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));

  return suffix ? `${label} (${suffix})` : label;
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 9v4M12 17h.01M10.29 3.86l-8.4 14.55A1 1 0 0 0 2.7 20h18.6a1 1 0 0 0 .86-1.59l-8.4-14.55a1 1 0 0 0-1.72 0Z" />
    </svg>
  );
}

function visibleManageButtons(buttons?: FlowButton[]): FlowButton[] {
  return (buttons ?? []).filter((button) => {
    if (button.url?.includes("wa.me")) return false;
    if (button.id === "3") return false;
    if (button.id === "menu_reservation") return false;
    if (button.id === "menu_enquiries") return false;
    if (button.id === "menu_menu") return false;
    return true;
  });
}

export default function ManageReservationPageClient() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [screenIndex, setScreenIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentScreen = screens[screenIndex];
  const todayISO = getLagosTodayISO();
  const tomorrowISO = addDaysToISO(todayISO, 1);
  const dayAfterISO = addDaysToISO(todayISO, 2);
  const isFirstLoad = isSending && screens.length === 0;
  const isAwaitingReply = isSending && screens.length > 0;
  const isComplete =
    !!currentScreen &&
    currentScreen.session.step === "MAIN_MENU" &&
    visibleManageButtons(currentScreen.buttons).length === 0;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code")?.trim();
    const phone = params.get("phone")?.trim();

    const lookupValue = code || phone;

    if (lookupValue) {
      void loadReservation(lookupValue);
      return;
    }

    setScreens([
      {
        reply:
          "Enter your reservation code or the phone number you booked with.",
        session: MANAGE_SESSION,
      },
    ]);
  }, []);

  useEffect(() => {
    if (currentScreen?.inputType === "date") {
      setInputValue((current) => current || todayISO);
      return;
    }

    if (!currentScreen?.buttons?.length && !isComplete) {
      inputRef.current?.focus();
    }
  }, [currentScreen?.inputType, currentScreen?.session.step, screenIndex, todayISO, isComplete]);

  async function requestFlow(message: string, session: FlowState) {
    const res = await fetch("/api/ai/reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, session }),
    });

    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    return (await res.json()) as ReservationApiResponse;
  }

  function toScreen(data: ReservationApiResponse, fallbackSession: FlowState): Screen {
    return {
      reply: data.message ?? "",
      buttons: visibleManageButtons(data.buttons),
      inputType: data.inputType,
      summary: data.summary,
      session: data.session ?? fallbackSession,
    };
  }

  async function loadReservation(code: string) {
    setError(null);
    setIsSending(true);
    setDirection(1);

    try {
      const data = await requestFlow(code, MANAGE_SESSION);
      setScreens([toScreen(data, MANAGE_SESSION)]);
      setScreenIndex(0);
      setInputValue("");
    } catch (err) {
      console.error("Manage reservation load error:", err);
      setError("Unable to load your reservation right now. Please try again.");
      setScreens([
        {
          reply:
            "Enter your reservation code or the phone number you booked with.",
          session: MANAGE_SESSION,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function advance(rawValue: string, buttonId?: string) {
    if (isSending || !currentScreen) return;
    if (!buttonId && !rawValue.trim()) return;

    setError(null);
    setIsSending(true);
    setDirection(1);

    try {
      const message = buttonId ?? rawValue.trim();
      const data = await requestFlow(message, currentScreen.session);
      const nextScreen = toScreen(data, currentScreen.session);

      setScreens((previous) => [
        ...previous.slice(0, screenIndex + 1),
        nextScreen,
      ]);
      setScreenIndex((index) => index + 1);
      setInputValue("");

      if (
        currentScreen.session.step === "MANAGE_CODE" &&
        nextScreen.session.manageCode
      ) {
        const url = new URL(window.location.href);
        url.searchParams.set("code", nextScreen.session.manageCode);
        window.history.replaceState({}, "", url.toString());
      }
    } catch (err) {
      console.error("Manage reservation page error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  function goBack() {
    if (screenIndex === 0 || isSending) return;
    setDirection(-1);
    setInputValue("");
    setScreenIndex((index) => index - 1);
  }

  function handleButtonClick(button: FlowButton) {
    if (button.url) return;
    void advance("", button.id);
  }

  function handleTextSubmit(event: FormEvent) {
    event.preventDefault();
    if (currentScreen?.inputType === "date") {
      void advance(inputValue || todayISO);
      return;
    }
    void advance(inputValue);
  }

  return (
    <div className="min-h-[100dvh] bg-coconut-cream px-0 py-0 md:px-6 md:py-10">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-coconut-cream md:min-h-[760px] md:rounded-3xl md:border md:border-clay-pot/15 md:shadow-[0_24px_70px_rgba(75,58,46,0.18)]">
        <header className="flex shrink-0 items-center justify-between bg-terracotta px-5 py-4 md:px-7">
          <div className="flex items-center gap-3">
            {screenIndex > 0 && (
              <button
                type="button"
                onClick={goBack}
                disabled={isSending}
                aria-label="Back"
                className="rounded-full p-1 text-coconut-cream/80 transition-all duration-200 hover:bg-tamarind-bark hover:text-coconut-cream active:scale-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            <img
              src="/images/ks-kitchen-pepper.jpg"
              alt=""
              aria-hidden="true"
              className="h-10 w-10 rounded-full border border-coconut-cream/40 object-cover"
            />

            <div>
              <p className="font-display text-base tracking-tight text-coconut-cream">
                K&apos;s Kitchen Gourmet
              </p>
              <p className="font-hand text-sm text-coconut-cream/80">
                Manage reservation
              </p>
            </div>
          </div>
        </header>

        <main className="relative min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {currentScreen && (
              <motion.div
                key={screenIndex}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute inset-0 flex flex-col overflow-y-auto px-6 py-8 md:px-10 md:py-10"
              >
                <p className="whitespace-pre-line text-lg leading-relaxed text-roasted-coffee" aria-live="polite">
                  {currentScreen.reply}
                </p>

                {currentScreen.summary && currentScreen.summary.length > 0 && (
                  <div className="mt-6 overflow-hidden rounded-2xl border border-clay-pot/20 bg-surface shadow-[0_1px_4px_rgba(75,58,46,0.12)]">
                    {currentScreen.summary.map((row, index) => (
                      <div
                        key={`${row.label}-${index}`}
                        className={`flex items-center justify-between gap-6 px-5 py-3.5 ${
                          index !== currentScreen.summary!.length - 1
                            ? "border-b border-clay-pot/10"
                            : ""
                        }`}
                      >
                        <span className="text-xs font-medium uppercase tracking-wide text-roasted-coffee/50">
                          {row.label}
                        </span>
                        <span className="text-right text-sm font-semibold text-roasted-coffee">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 flex-1">
                  {currentScreen.buttons && currentScreen.buttons.length > 0 ? (
                    <div className="space-y-3">
                      {currentScreen.buttons.map((button) => {
                        const isCancel =
                          currentScreen.session.step === "MANAGE_ACTION" &&
                          button.id === "1";

                        return (
                          <button
                            key={button.id}
                            type="button"
                            onClick={() => handleButtonClick(button)}
                            disabled={isSending}
                            className={
                              isCancel
                                ? "flex w-full items-center rounded-xl border border-red-700/20 bg-red-50 px-5 py-4 text-left text-base font-medium text-red-800 transition-all duration-200 hover:border-red-700/35 hover:bg-red-100 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700/30"
                                : "flex w-full items-center rounded-xl border border-clay-pot/30 bg-surface px-5 py-4 text-left text-base font-medium text-roasted-coffee shadow-[0_1px_3px_rgba(75,58,46,0.12)] transition-all duration-200 hover:border-clay-pot hover:bg-clay-pot/10 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass"
                            }
                          >
                            {button.title}
                          </button>
                        );
                      })}
                    </div>
                  ) : currentScreen.inputType === "date" ? (
                    <form onSubmit={handleTextSubmit} className="min-w-0 space-y-4">
                      <div className="text-sm font-medium text-roasted-coffee">
                        {formatBookingDateLabel(
                          inputValue || todayISO,
                          (inputValue || todayISO) === todayISO ? "Today" : undefined,
                        )}
                      </div>

                      <input
                        type="date"
                        value={inputValue || todayISO}
                        min={todayISO}
                        onChange={(event) => setInputValue(event.target.value)}
                        className="block w-full min-w-0 max-w-full rounded-xl border border-tamarind-bark/20 bg-surface px-4 py-3 text-base text-roasted-coffee outline-none transition-colors duration-200 focus:border-brushed-brass focus-visible:ring-2 focus-visible:ring-brushed-brass/50"
                      />

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {[{ label: "Today", value: todayISO }, { label: "Tomorrow", value: tomorrowISO }, { label: "Day after", value: dayAfterISO }].map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setInputValue(item.value)}
                            className="rounded-xl border border-clay-pot/25 bg-surface px-4 py-3 text-left text-sm text-roasted-coffee transition hover:border-clay-pot hover:bg-clay-pot/10"
                          >
                            <span className="block text-xs uppercase tracking-wide opacity-75">{item.label}</span>
                            <span className="mt-1 block font-semibold">{formatBookingDateLabel(item.value)}</span>
                          </button>
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={isSending || !(inputValue || todayISO)}
                        className="w-full rounded-xl bg-clay-pot px-5 py-3 text-base font-medium text-coconut-cream transition-all duration-200 hover:bg-terracotta active:scale-[0.98] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass focus-visible:ring-offset-2 focus-visible:ring-offset-coconut-cream"
                      >
                        Continue
                      </button>
                    </form>
                  ) : isComplete ? (
                    <div className="space-y-3">
                      <Link
                        href="/reservation"
                        className="flex w-full items-center justify-center rounded-xl bg-clay-pot px-5 py-3.5 text-base font-medium text-coconut-cream transition-all duration-200 hover:bg-terracotta active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass"
                      >
                        Make a new reservation
                      </Link>
                      <Link
                        href="/"
                        className="flex w-full items-center justify-center rounded-xl border border-clay-pot/25 bg-surface px-5 py-3.5 text-base font-medium text-roasted-coffee transition-all duration-200 hover:border-clay-pot hover:bg-clay-pot/10 active:scale-[0.98]"
                      >
                        Return to K&apos;s Kitchen
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleTextSubmit} className="space-y-4">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(event) => setInputValue(event.target.value)}
                        placeholder="Reservation code"
                        autoCapitalize="characters"
                        disabled={isSending}
                        className="w-full min-w-0 rounded-xl border border-tamarind-bark/20 bg-surface px-4 py-3 text-base uppercase text-roasted-coffee outline-none transition-colors duration-200 placeholder:normal-case focus:border-brushed-brass focus-visible:ring-2 focus-visible:ring-brushed-brass/50 disabled:opacity-60"
                      />

                      <button
                        type="submit"
                        disabled={isSending || !inputValue.trim()}
                        className="w-full rounded-xl bg-clay-pot px-5 py-3 text-base font-medium text-coconut-cream transition-all duration-200 hover:bg-terracotta active:scale-[0.98] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass focus-visible:ring-offset-2 focus-visible:ring-offset-coconut-cream"
                      >
                        Find reservation
                      </button>
                    </form>
                  )}

                  {isAwaitingReply && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-roasted-coffee/50" aria-live="polite">
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-tamarind-bark/50 [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-tamarind-bark/50 [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-tamarind-bark/50" />
                      </span>
                      Updating...
                    </div>
                  )}
                </div>

                {error && (
                  <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-alert/20 bg-alert/10 px-4 py-3 text-sm text-alert">
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {isFirstLoad && (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-tamarind-bark/50 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-tamarind-bark/50 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-tamarind-bark/50" />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
