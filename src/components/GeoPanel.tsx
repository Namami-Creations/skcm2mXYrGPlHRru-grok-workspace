import { useMemo, useState } from "react";
import { Compass, Flame, MapPin, ShieldCheck } from "lucide-react";
import { CityBubbleAndArcRow } from "@/components/DonutCharts";
import { IndiaConstituencyMap } from "@/components/IndiaConstituencyMap";
import { t } from "@/lib/i18n";
import type { CityBreakdown, Language, Outcome } from "@/lib/types";

export function GeoPanel({
  cities,
  outcomes,
  marketId,
  token,
  lang = "en",
}: {
  cities: CityBreakdown[];
  outcomes: Outcome[];
  marketId: string;
  token: string;
  lang?: Language;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "divergent">("all");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const copy = t(lang);

  const globalLeader = useMemo(() => [...outcomes].sort((a, b) => b.pct - a.pct)[0], [outcomes]);

  const filtered = useMemo(() => {
    return cities.filter((c) => {
      if (search.trim() && !c.city.toLowerCase().includes(search.trim().toLowerCase())) return false;
      if (filter === "divergent") {
        return (globalLeader && c.dominantOutcomeId !== globalLeader.id) || Math.abs(c.divergencePct) >= 3;
      }
      return true;
    });
  }, [cities, search, filter, globalLeader]);

  const active = cities.find((c) => c.city === selectedCity) ?? filtered[0] ?? cities[0];

  return (
    <div className="rounded border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-primary" />
            <h3 className="font-mono text-xs font-bold tracking-wider text-fg uppercase">
              {copy.cityRadarTitle}
            </h3>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
              {cities.length} CITIES LIVE
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">{copy.cityRadarSub}</p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search city..."
            className="w-36 rounded border border-line bg-bg px-2.5 py-1 text-fg outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setFilter(filter === "all" ? "divergent" : "all")}
            className={`flex items-center gap-1 rounded border px-2.5 py-1 ${
              filter === "divergent"
                ? "border-accent bg-accent/15 text-accent font-bold"
                : "border-line bg-bg text-muted hover:text-fg"
            }`}
          >
            <Flame className="size-3" />
            Divergent
          </button>
        </div>
      </div>

      {/* City Bubble Cluster + 240-Degree Arc Breakdown */}
      <CityBubbleAndArcRow
        cities={cities}
        outcomes={outcomes}
        selectedCity={active?.city}
        onSelectCity={(city) => setSelectedCity(city)}
      />

      {/* City Selector Pills */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {filtered.map((c) => {
          const isSelected = active?.city === c.city;
          const isContrarian = globalLeader && c.dominantOutcomeId !== globalLeader.id;
          return (
            <button
              key={c.city}
              type="button"
              onClick={() => setSelectedCity(c.city)}
              className={`flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-xs transition-colors ${
                isSelected
                  ? "border-primary bg-primary text-bg font-bold"
                  : isContrarian
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-line bg-bg text-fg hover:border-primary/50"
              }`}
            >
              <MapPin className="size-3" />
              <span>{c.city}</span>
              <span className={`text-[10px] ${isSelected ? "text-bg" : "text-muted"}`}>
                {c.shares[c.dominantOutcomeId]?.toFixed(0)}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Active City Deep-Dive */}
      {active && (
        <div className="mt-3 rounded border border-line bg-bg/80 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-fg">
                {active.city}, {active.state}
              </span>
              <span className="rounded bg-surface px-2 py-0.5 font-mono text-[10px] text-muted">
                {active.totalVotes} Ballots
              </span>
              <span className="flex items-center gap-1 font-mono text-[10px] text-primary">
                <ShieldCheck className="size-3" />
                {active.verifiedSharePct}% OTP-Verified
              </span>
            </div>
            <span className="font-mono text-xs text-muted">
              Delta vs Global:{" "}
              <strong className={active.divergencePct >= 0 ? "text-primary" : "text-accent"}>
                {active.divergencePct > 0 ? "+" : ""}
                {active.divergencePct}%
              </strong>
            </span>
          </div>

          <div className="mt-2.5 flex h-3 w-full overflow-hidden rounded-xs bg-surface">
            {outcomes.map((o) => {
              const pct = active.shares[o.id] ?? 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={o.id}
                  style={{ width: `${pct}%`, backgroundColor: o.color }}
                  title={`${o.label}: ${pct.toFixed(1)}%`}
                  className="h-full"
                />
              );
            })}
          </div>
        </div>
      )}

      {/* City Grid */}
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const dom = outcomes.find((o) => o.id === c.dominantOutcomeId);
          return (
            <div key={c.city} className="rounded border border-line/70 bg-bg/70 p-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-fg">{c.city}</span>
                <span className="text-[10px] text-muted">{c.totalVotes} calls</span>
              </div>
              <p className="mt-1 text-[11px] text-primary">
                Lead: {dom?.label ?? c.dominantOutcomeId} ({(c.shares[c.dominantOutcomeId] ?? 0).toFixed(1)}%)
              </p>
              <div className="mt-2 space-y-1">
                {outcomes.slice(0, 3).map((o) => (
                  <div key={o.id} className="flex items-center justify-between text-[10px] text-muted">
                    <span className="truncate">{o.label}</span>
                    <span className="tabular-nums text-fg">{(c.shares[o.id] ?? 0).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive India Map, 5-Zone UP Spider Radar & 403-Seat Explorer */}
      <IndiaConstituencyMap
        marketId={marketId}
        token={token}
        cities={cities}
        outcomes={outcomes}
        selectedCity={active?.city}
        onSelectCity={(city) => setSelectedCity(city)}
        lang={lang}
      />
    </div>
  );
}
