"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function DashboardLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(
          "We couldn't sign you in. Check your email and password, then try again.",
        );
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Dashboard sign-in failed", error);
      setErrorMessage("We couldn't connect right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-admin-bg text-admin-ink lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)]">
      <section
        aria-label="K's Kitchen"
        className="relative flex min-h-[250px] flex-col justify-between overflow-hidden bg-roasted-coffee bg-cover bg-center px-7 py-7 text-coconut-cream sm:min-h-[320px] sm:px-10 sm:py-9 lg:min-h-screen lg:px-14 lg:py-12"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(30, 22, 18, 0.48), rgba(30, 22, 18, 0.2) 45%, rgba(30, 22, 18, 0.78)), url('/brand/interior.jpg')",
        }}
      >
        <div className="relative z-10">
          <p className="font-display text-2xl tracking-tight sm:text-3xl">
            K&apos;s Kitchen
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.22em] text-coconut-cream/75">
            Restaurant admin
          </p>
        </div>

        <div className="relative z-10 max-w-xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-coconut-cream/75">
            A little taste of home
          </p>
          <h1 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Good food.
            <br />
            Good people.
            <br />
            Every day.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-coconut-cream/80 sm:text-base">
            Your kitchen, thoughtfully brought together in one place.
          </p>
        </div>
      </section>

      <section className="flex min-h-[calc(100vh-250px)] items-center justify-center px-6 py-12 sm:px-10 lg:min-h-screen lg:px-12">
        <div className="w-full max-w-[410px]">
          <div className="mb-10 lg:mb-12">
            <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta/10 text-terracotta">
              <LockKeyhole aria-hidden="true" size={21} strokeWidth={1.7} />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
              Welcome back
            </p>
            <h2 className="font-display text-3xl tracking-tight text-admin-ink sm:text-[2.1rem]">
              Sign in to your dashboard
            </h2>
            <p className="mt-3 text-sm leading-6 text-admin-muted">
              Use your K&apos;s Kitchen account to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-admin-ink"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-xl border border-admin-border bg-white/70 px-4 text-sm text-admin-ink outline-none transition-[border-color,box-shadow] placeholder:text-admin-subtle focus:border-terracotta focus:ring-4 focus:ring-terracotta/10"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-admin-ink"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full rounded-xl border border-admin-border bg-white/70 px-4 pr-12 text-sm text-admin-ink outline-none transition-[border-color,box-shadow] placeholder:text-admin-subtle focus:border-terracotta focus:ring-4 focus:ring-terracotta/10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-admin-subtle transition-colors hover:text-admin-ink focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-terracotta"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" size={18} />
                  ) : (
                    <Eye aria-hidden="true" size={18} />
                  )}
                </button>
              </div>
            </div>

            {errorMessage && (
              <p
                role="alert"
                className="rounded-xl border border-alert/20 bg-alert/5 px-4 py-3 text-sm leading-5 text-alert"
              >
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-terracotta px-4 text-sm font-semibold text-coconut-cream shadow-[0_6px_16px_-8px_rgba(132,70,49,0.7)] transition-[background-color,transform,opacity] hover:bg-clay-pot active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-9 text-center text-xs leading-5 text-admin-subtle">
            K&apos;s Kitchen · Restaurant admin
          </p>
        </div>
      </section>
    </main>
  );
}
