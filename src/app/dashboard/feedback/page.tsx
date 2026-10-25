import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const CATEGORY_LABELS: Record<string, string> = {
  drinks_chilled: "Drinks Chilled",
  drinks_hot: "Drinks Hot",
  chati_idli: "The Chati Idli",
  dosa: "Dosa",
  uthapam: "Uthapam",
  dessert: "Dessert",
};

type FeedbackRow = {
  id: string | number;
  created_at: string | null;
  food_rating: number;
  service_rating: number;
  favourite_category: string;
  feedback: string | null;
};

type StatRow = Pick<
  FeedbackRow,
  "food_rating" | "service_rating" | "favourite_category"
>;

type Filter = "all" | "low" | "comments";

type SearchParams = Promise<{ filter?: string; page?: string }>;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "low", label: "Needs attention" },
  { id: "comments", label: "With comments" },
];

function average(values: number[]) {
  if (values.length === 0) return null;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDate(value: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function hrefFor(filter: Filter, page = 1) {
  const params = new URLSearchParams();

  if (filter !== "all") params.set("filter", filter);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `/dashboard/feedback?${query}` : "/dashboard/feedback";
}

function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wide text-admin-subtle">
        {label}
      </span>

      <span
        className="inline-flex gap-0.5 text-[13px] leading-none"
        role="img"
        aria-label={`${value} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= value ? "text-brushed-brass" : "text-admin-border"}
          >
            ★
          </span>
        ))}
      </span>
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-admin-surface p-5">
      <p className="text-[12px] uppercase tracking-wide text-admin-subtle">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl tracking-tight text-admin-ink">
        {value}
      </p>
      {hint && <p className="mt-1 text-[13px] text-admin-muted">{hint}</p>}
    </div>
  );
}

export default async function DashboardFeedbackPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // The proxy already guards /dashboard; re-check before using the service key.
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/dashboard/login");

  const params = await searchParams;
  const filter: Filter = FILTERS.some((f) => f.id === params.filter)
    ? (params.filter as Filter)
    : "all";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  // The public form inserts with the service role, so read with it too.
  const db = createServiceClient();

  let listQuery = db
    .from("feedback")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filter === "low") {
    listQuery = listQuery.or("food_rating.lte.2,service_rating.lte.2");
  }

  if (filter === "comments") {
    listQuery = listQuery.not("feedback", "is", null);
  }

  const from = (page - 1) * PAGE_SIZE;
  listQuery = listQuery.range(from, from + PAGE_SIZE - 1);

  const [{ data: rows, count, error }, { data: statRows }] = await Promise.all([
    listQuery,
    db
      .from("feedback")
      .select("food_rating, service_rating, favourite_category")
      .limit(5000),
  ]);

  if (error) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-alert/20 bg-alert/10 px-4 py-3 text-sm text-alert"
      >
        Couldn&apos;t load feedback: {error.message}
      </p>
    );
  }

  const entries = (rows ?? []) as FeedbackRow[];
  const stats = (statRows ?? []) as StatRow[];

  const total = stats.length;
  const avgFood = average(stats.map((row) => row.food_rating));
  const avgService = average(stats.map((row) => row.service_rating));

  const categoryCounts = Object.entries(
    stats.reduce<Record<string, number>>((acc, row) => {
      acc[row.favourite_category] = (acc[row.favourite_category] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const topCount = categoryCounts[0]?.[1] ?? 1;
  const matching = count ?? entries.length;
  const lastPage = Math.max(1, Math.ceil(matching / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-4xl">
      <p className="mb-8 text-sm text-admin-muted">
        What guests said through the feedback form.
      </p>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Responses" value={String(total)} />
        <StatCard
          label="Food"
          value={avgFood === null ? "–" : avgFood.toFixed(1)}
          hint="average out of 5"
        />
        <StatCard
          label="Service"
          value={avgService === null ? "–" : avgService.toFixed(1)}
          hint="average out of 5"
        />
      </div>

      {categoryCounts.length > 0 && (
        <div className="mt-3 rounded-2xl bg-admin-surface p-5">
          <p className="text-[12px] uppercase tracking-wide text-admin-subtle">
            Favourite category
          </p>

          <ul className="mt-4 space-y-3">
            {categoryCounts.map(([category, amount]) => (
              <li key={category} className="flex items-center gap-4">
                <span className="w-32 shrink-0 text-[13px] text-admin-ink">
                  {CATEGORY_LABELS[category] ?? category}
                </span>

                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-admin-border/60">
                  <span
                    className="block h-full origin-left rounded-full bg-terracotta"
                    style={{ width: `${(amount / topCount) * 100}%` }}
                  />
                </span>

                <span className="w-8 shrink-0 text-right text-[13px] tabular-nums text-admin-muted">
                  {amount}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filters */}
      <nav
        aria-label="Filter feedback"
        className="mt-10 mb-5 flex flex-wrap gap-2"
      >
        {FILTERS.map((item) => {
          const active = item.id === filter;

          return (
            <Link
              key={item.id}
              href={hrefFor(item.id)}
              aria-current={active ? "page" : undefined}
              className={[
                "rounded-full px-4 py-2 text-[13px] transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.97]",
                active
                  ? "bg-terracotta/10 font-medium text-terracotta"
                  : "bg-admin-surface text-admin-muted [@media(hover:hover)]:hover:text-admin-ink",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* List */}
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-admin-border px-6 py-14 text-center">
          <p className="text-sm text-admin-muted">
            {filter === "all"
              ? "No feedback yet. It will appear here as guests submit the form."
              : "Nothing matches this filter."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-2xl bg-admin-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                  <Stars value={entry.food_rating} label="Food" />
                  <Stars value={entry.service_rating} label="Service" />
                </div>

                <time
                  dateTime={entry.created_at ?? undefined}
                  className="text-[12px] text-admin-subtle"
                >
                  {formatDate(entry.created_at)}
                </time>
              </div>

              <p className="mt-3">
                <span className="rounded-full bg-terracotta/10 px-2.5 py-1 text-[11px] text-terracotta">
                  {CATEGORY_LABELS[entry.favourite_category] ??
                    entry.favourite_category}
                </span>
              </p>

              {entry.feedback && (
                <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-admin-ink">
                  {entry.feedback}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="mt-6 flex items-center justify-between text-[13px] text-admin-muted">
          {page > 1 ? (
            <Link
              href={hrefFor(filter, page - 1)}
              className="rounded-full bg-admin-surface px-4 py-2 transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              ← Newer
            </Link>
          ) : (
            <span />
          )}

          <span>
            Page {page} of {lastPage}
          </span>

          {page < lastPage ? (
            <Link
              href={hrefFor(filter, page + 1)}
              className="rounded-full bg-admin-surface px-4 py-2 transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Older →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
