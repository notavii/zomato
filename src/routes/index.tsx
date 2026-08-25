import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Lightbulb,
  MapPin,
  Search,
  IceCreamCone,
  IndianRupee,
  Star,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zomato Business — Bangalore Restaurant Market Intelligence" },
      {
        name: "description",
        content:
          "Find where to open, what to serve and what to charge in Bangalore, based on analysis of 51,717 Zomato listings.",
      },
      { property: "og:title", content: "Zomato Business — Bangalore Restaurant Market Intelligence" },
      {
        property: "og:description",
        content:
          "Locality opportunity scores, cuisine gaps and pricing benchmarks from 12,137 Bangalore restaurants.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ZomatoBusiness,
});

/* ---------------- data ---------------- */

const KPIS = [
  { label: "Restaurants Analyzed", value: "12,137" },
  { label: "City Avg Rating", value: "3.64★" },
  { label: "Avg Cost for Two", value: "₹492" },
  { label: "Online Ordering Adoption", value: "58.9%" },
];

const COMPETITION = [
  { locality: "BTM", restaurants: 5124 },
  { locality: "HSR", restaurants: 2523 },
  { locality: "Koramangala 5th Block", restaurants: 2504 },
  { locality: "JP Nagar", restaurants: 2235 },
  { locality: "Whitefield", restaurants: 2144 },
  { locality: "Indiranagar", restaurants: 2083 },
  { locality: "Jayanagar", restaurants: 1926 },
  { locality: "Marathahalli", restaurants: 1846 },
];

type Loc = {
  locality: string;
  restaurants: number;
  avgCost: number;
  rating: number | null;
  dessertGap: number;
};

const LOCALITIES: Loc[] = [
  { locality: "Whitefield", restaurants: 821, avgCost: 598, rating: null, dessertGap: 1 },
  { locality: "Electronic City", restaurants: 694, avgCost: 497, rating: null, dessertGap: 0 },
  { locality: "Marathahalli", restaurants: 657, avgCost: 514, rating: null, dessertGap: 1 },
  { locality: "JP Nagar", restaurants: 501, avgCost: 523, rating: 3.65, dessertGap: 1 },
  { locality: "Bannerghatta Road", restaurants: 448, avgCost: 444, rating: null, dessertGap: 2 },
  { locality: "Bellandur", restaurants: 349, avgCost: 528, rating: null, dessertGap: 2 },
  { locality: "Sarjapur Road", restaurants: 326, avgCost: 574, rating: null, dessertGap: 1 },
  { locality: "Malleshwaram", restaurants: 231, avgCost: 551, rating: 3.74, dessertGap: 1 },
  { locality: "Basavanagudi", restaurants: 205, avgCost: 361, rating: 3.69, dessertGap: 1 },
  { locality: "Koramangala 4th Block", restaurants: 133, avgCost: 696, rating: 3.84, dessertGap: 1 },
  { locality: "Brigade Road", restaurants: 126, avgCost: 651, rating: 3.72, dessertGap: 1 },
  { locality: "Ulsoor", restaurants: 117, avgCost: 766, rating: 3.74, dessertGap: 0 },
  { locality: "Nagawara", restaurants: 103, avgCost: 433, rating: null, dessertGap: 0 },
];

const OPPORTUNITY_CUISINES = [
  { cuisine: "Desserts, Beverages", rating: 4.01, count: 47 },
  { cuisine: "Desserts, Ice Cream", rating: 3.87, count: 51 },
];

const AVOID_CUISINES = [
  { cuisine: "North Indian, Chinese", rating: 3.4, count: 448 },
  { cuisine: "Biryani", rating: 3.44, count: 157 },
  { cuisine: "Fast Food", rating: 3.47, count: 129 },
  { cuisine: "Cafe, Fast Food", rating: 3.33, count: 53 },
];

const TIERS = [
  { tier: "Budget", avgVotes: 44, avgRating: 3.56 },
  { tier: "Mid-range", avgVotes: 115, avgRating: 3.58 },
  { tier: "Premium", avgVotes: 648, avgRating: 3.88 },
  { tier: "Luxury", avgVotes: 1050, avgRating: 4.17 },
];

/* ---------------- primitives ---------------- */

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>{children}</div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-2.5">
      <Icon className="mt-0.5 size-[18px] shrink-0 text-brand" strokeWidth={1.75} />
      <div>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {sub ? <p className="text-sm text-muted-foreground">{sub}</p> : null}
      </div>
    </div>
  );
}

function Pill({ level }: { level: "High" | "Medium" | "Low" }) {
  const tone =
    level === "High"
      ? "bg-brand/10 text-brand"
      : level === "Medium"
        ? "bg-moderate/10 text-moderate"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
      {level} priority
    </span>
  );
}

/* ---------------- tabs ---------------- */

function Overview() {
  const max = Math.max(...COMPETITION.map((c) => c.restaurants));
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label}>
            <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">
              {k.value}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <SectionHeader
          icon={BarChart3}
          title="Where Competition Is Highest"
          sub="Listing volume by locality across 51,717 Zomato listings"
        />
        <div className="space-y-3">
          {COMPETITION.map((c) => (
            <div key={c.locality} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-xs font-medium text-muted-foreground sm:w-48 sm:text-sm">
                {c.locality}
              </span>
              <div className="h-2.5 flex-1 rounded-full bg-muted">
                <div
                  className="h-2.5 rounded-full bg-brand"
                  style={{ width: `${(c.restaurants / max) * 100}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-xs font-bold tabular-nums sm:text-sm">
                {c.restaurants.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function scores(loc: Loc) {
  const competitionScore = (100 * (821 - loc.restaurants)) / (821 - 103);
  const demandScore = ((loc.avgCost - 361) / (766 - 361)) * 100;
  const ratingScore = loc.rating !== null ? ((loc.rating - 3.4) / (4.1 - 3.4)) * 100 : 40;
  const opportunityIndex = Math.round(
    competitionScore * 0.4 + demandScore * 0.35 + ratingScore * 0.25,
  );
  const band =
    opportunityIndex < 40 ? "Saturated" : opportunityIndex <= 70 ? "Worth a closer look" : "High Opportunity";
  return { competitionScore, demandScore, ratingScore, opportunityIndex, band };
}

function OpportunityFinder() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Loc>(LOCALITIES[0]!);

  const filtered = useMemo(
    () => LOCALITIES.filter((l) => l.locality.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );
  const s = scores(selected);
  const bandColor =
    s.band === "Saturated" ? "var(--bad)" : s.band === "High Opportunity" ? "var(--good)" : "var(--moderate)";

  const rows = [
    {
      metric: "Restaurant Count",
      here: selected.restaurants.toLocaleString("en-IN"),
      city: "~135 (median locality)",
      good: selected.restaurants <= 350,
      note: selected.restaurants <= 350 ? "Room to enter" : "Crowded",
    },
    {
      metric: "Avg Cost for Two",
      here: `₹${selected.avgCost}`,
      city: "₹492",
      good: selected.avgCost >= 492,
      note: selected.avgCost >= 492 ? "Higher spend" : "Price-sensitive",
    },
    {
      metric: "Avg Rating",
      here: selected.rating !== null ? `${selected.rating.toFixed(2)}★` : "Not independently confirmed",
      city: "3.64★",
      good: selected.rating !== null && selected.rating >= 3.64,
      note:
        selected.rating === null
          ? "Unverified"
          : selected.rating >= 3.64
            ? "Above city"
            : "Below city",
    },
    {
      metric: "Dessert/Beverage Supply",
      here: `${selected.dessertGap} outlet(s)`,
      city: "47 citywide at 4.01★",
      good: selected.dessertGap <= 1,
      note: selected.dessertGap <= 1 ? "Underserved" : "Covered",
    },
  ];

  const bars = [
    { label: "Competition", weight: 40, score: s.competitionScore, color: "var(--brand)" },
    { label: "Demand", weight: 35, score: s.demandScore, color: "var(--moderate)" },
    { label: "Rating", weight: 25, score: s.ratingScore, color: "var(--good)" },
  ];

  return (
    <div className="space-y-8">
      <Card>
        <SectionHeader icon={MapPin} title="Pick a locality" sub="Search Bangalore localities in the dataset" />
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={open ? query : selected.locality}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setQuery("");
              setOpen(true);
            }}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder="Search locality…"
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm font-medium outline-none focus:border-brand"
          />
          {open && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-sm">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">No match</li>
              )}
              {filtered.map((l) => (
                <li key={l.locality}>
                  <button
                    type="button"
                    onMouseDown={() => {
                      setSelected(l);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span className="font-medium">{l.locality}</span>
                    <span className="text-xs text-muted-foreground">
                      {l.restaurants} · ₹{l.avgCost}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card className="flex flex-col items-center py-10 text-center">
        <div
          className="flex size-40 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${bandColor} ${s.opportunityIndex * 3.6}deg, var(--muted) 0deg)`,
          }}
        >
          <div className="flex size-32 flex-col items-center justify-center rounded-full bg-card">
            <span className="text-4xl font-extrabold tabular-nums" style={{ color: bandColor }}>
              {s.opportunityIndex}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">/ 100</span>
          </div>
        </div>
        <span
          className="mt-5 rounded-full px-3 py-1 text-sm font-semibold"
          style={{ color: bandColor, backgroundColor: `color-mix(in oklch, ${bandColor} 12%, transparent)` }}
        >
          {s.band}
        </span>
        <p className="mt-2 text-sm text-muted-foreground">
          Opportunity Index for <span className="font-semibold text-foreground">{selected.locality}</span>
        </p>
      </Card>

      <Card>
        <SectionHeader icon={BarChart3} title="vs City Average" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-semibold">Metric</th>
                <th className="py-2 pr-3 font-semibold">This Locality</th>
                <th className="py-2 pr-3 font-semibold">City Average</th>
                <th className="py-2 font-semibold">Signal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.metric} className="border-b border-border last:border-0">
                  <td className="py-3 pr-3 font-medium">{r.metric}</td>
                  <td className="py-3 pr-3 font-bold tabular-nums">{r.here}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{r.city}</td>
                  <td
                    className="py-3 font-semibold"
                    style={{ color: r.good ? "var(--good)" : "var(--bad)" }}
                  >
                    {r.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div>
        <SectionHeader icon={Lightbulb} title="Actionable Insights" />
        <div className="grid gap-3 lg:grid-cols-3">
          <Card>
            <IceCreamCone className="size-5 text-brand" strokeWidth={1.75} />
            <div className="mt-3 flex items-center justify-between gap-2">
              <h3 className="font-bold">Dessert & Beverage Gap</h3>
              <Pill level="High" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              This category is proven at 4.01★ citywide (47 restaurants) but this locality has only{" "}
              {selected.dessertGap} such outlet(s). Underserved, high-rated categories are the
              strongest opportunity signal in this dataset.
            </p>
            <p className="mt-4 text-sm font-bold">
              Lead with desserts and beverages in {selected.locality}.
            </p>
          </Card>

          <Card>
            <IndianRupee className="size-5 text-brand" strokeWidth={1.75} />
            <div className="mt-3 flex items-center justify-between gap-2">
              <h3 className="font-bold">Pricing Position</h3>
              <Pill level="Medium" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Premium-tier restaurants (₹701–1500) average 648 votes vs. just 115 for Mid-range — a
              5.6x engagement gap for a modest quality bar. Consider positioning above budget/mid-range
              if execution quality supports it.
            </p>
            <p className="mt-4 text-sm font-bold">
              Price toward the premium tier, not the middle.
            </p>
          </Card>

          <Card>
            <Star className="size-5 text-brand" strokeWidth={1.75} />
            <div className="mt-3 flex items-center justify-between gap-2">
              <h3 className="font-bold">Quality Bar to Clear</h3>
              <Pill level="High" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Restaurants rated 4★+ capture 72.9% of all customer votes citywide despite being only
              23.7% of restaurants. In a market this competitive, "good enough" quality is effectively
              invisible — plan to clear 4★, not just the local average.
            </p>
            <p className="mt-4 text-sm font-bold">Target 4★+ from day one.</p>
          </Card>
        </div>
      </div>

      <Card>
        <SectionHeader icon={TrendingUp} title="Opportunity Breakdown" sub="How each factor built the score" />
        <div className="space-y-4">
          {bars.map((b) => (
            <div key={b.label}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">
                  {b.label}{" "}
                  <span className="text-xs text-muted-foreground">(weight {b.weight}%)</span>
                </span>
                <span className="font-bold tabular-nums">
                  {Math.round(b.score)} → {(b.score * (b.weight / 100)).toFixed(1)} pts
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted">
                <div
                  className="h-2.5 rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, b.score))}%`,
                    backgroundColor: b.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Playbook() {
  const maxVotes = Math.max(...TIERS.map((t) => t.avgVotes));
  return (
    <div className="space-y-8">
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "var(--good)" }}>
            <Lightbulb className="size-[18px]" strokeWidth={1.75} /> Opportunities
          </h2>
          <ul className="mt-4 space-y-3">
            {OPPORTUNITY_CUISINES.map((c) => (
              <li
                key={c.cuisine}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
              >
                <span className="text-sm font-semibold">{c.cuisine}</span>
                <span className="text-sm tabular-nums" style={{ color: "var(--good)" }}>
                  <b>{c.rating.toFixed(2)}★</b>{" "}
                  <span className="text-muted-foreground">· {c.count}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "var(--bad)" }}>
            <ShieldAlert className="size-[18px]" strokeWidth={1.75} /> Avoid — Oversaturated
          </h2>
          <ul className="mt-4 space-y-3">
            {AVOID_CUISINES.map((c) => (
              <li
                key={c.cuisine}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
              >
                <span className="text-sm font-semibold">{c.cuisine}</span>
                <span className="text-sm tabular-nums" style={{ color: "var(--bad)" }}>
                  <b>{c.rating.toFixed(2)}★</b>{" "}
                  <span className="text-muted-foreground">· {c.count}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <SectionHeader icon={BarChart3} title="Pricing Tier vs. Customer Engagement" />
        <div className="space-y-4">
          {TIERS.map((t) => (
            <div key={t.tier} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground sm:text-sm">
                {t.tier}
              </span>
              <div className="h-2.5 flex-1 rounded-full bg-muted">
                <div
                  className="h-2.5 rounded-full bg-brand"
                  style={{ width: `${(t.avgVotes / maxVotes) * 100}%` }}
                />
              </div>
              <span className="w-28 shrink-0 text-right text-xs font-bold tabular-nums sm:text-sm">
                {t.avgVotes} votes
                <span className="ml-1 font-medium text-muted-foreground">{t.avgRating}★</span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-5 rounded-lg bg-muted px-4 py-3 text-sm font-semibold">
          Luxury-tier restaurants get ~24x more customer engagement than Budget, on only a 0.6★
          rating difference.
        </p>
      </Card>
    </div>
  );
}

/* ---------------- shell ---------------- */

const TABS = ["Overview", "Opportunity Finder", "Playbook"] as const;

function ZomatoBusiness() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 pt-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-brand sm:text-4xl">Zomato Business</h1>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            Restaurant Market Intelligence — Bangalore
          </p>
          <p className="mt-3 max-w-2xl text-sm text-foreground/80">
            Know where to open, what to serve, and what to charge — backed by real market data, not
            guesswork.
          </p>
          <nav className="mt-6 flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`whitespace-nowrap border-b-2 px-3 pb-3 text-sm font-semibold transition-colors ${
                  tab === t
                    ? "border-brand text-brand"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {tab === "Overview" && <Overview />}
        {tab === "Opportunity Finder" && <OpportunityFinder />}
        {tab === "Playbook" && <Playbook />}
      </main>

      <footer className="border-t border-border">
        <p className="mx-auto max-w-5xl px-4 py-8 text-xs leading-relaxed text-muted-foreground">
          Built from SQL analysis of 51,717 real Zomato Bangalore listings. Decision-support signal,
          not a guarantee — pair with on-ground research before committing capital.
        </p>
      </footer>
    </div>
  );
}
