'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-coconut-cream px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-roasted-coffee">
            K & apos;s Kitchen
          </h1>
          <p className="mt-1 font-sans text-sm text-roasted-coffee/60">
            Staff dashboard
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-roasted-coffee/10 bg-white/40 p-6 space-y-4"
        >
          <div>
            <label className="block font-sans text-xs uppercase tracking-wide text-roasted-coffee/60 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-roasted-coffee/20 bg-white px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-clay-pot"
            />
          </div>

          <div>
            <label className="block font-sans text-xs uppercase tracking-wide text-roasted-coffee/60 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-roasted-coffee/20 bg-white px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-clay-pot"
            />
          </div>

          {error && (
            <p className="font-sans text-sm text-clay-pot"> {error} </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-clay-pot px-6 py-2.5 font-sans text-sm text-coconut-cream disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
