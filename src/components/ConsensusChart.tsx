import { useMemo, useState } from "react";
import { Activity, Award, BarChart3, Flame, Layers, Radio, Sparkles } from "lucide-react";
import {
  ConvictionStreamFunnel,
  InteractiveConsensusDonut,
} from "@/components/DonutCharts";
import type { ChartPoint, Language, Outcome, UiMode } from "@/lib/types";

type ChartMode = "race" | "columns" | "delta";

function SemiCircleTachometer({
  value,
  max = 100,
  label,
  sublabel,
  color,
  unit = "%",
}: {
  value: number;
  max?: number;
  label: string;
  sublabel: string;
  color: string;
  unit?: string;
}) {
  const clamped = Math.max(0, Math.min(max, value));
  const ratio = clamped / max;
  const angle = -180 + ratio * 180;
  const rad = (angle * Math.PI) / 180;
  const cx = 60;
  const cy = 54;
  const r = 42;
  const nx = cx + (r - 6) * Math.cos(rad);
  const ny = cy + (r - 6) * Math.sin(rad);

  return (
    <div className="flex flex-col items-center justify-between rounded border border-line bg-bg/70 p-2.5">
      <svg viewBox="0 0 120 64" className="h-14 w-28 overflow-visible">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#dff1ee"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${Math.PI * r}`}
          strokeDashoffset={`${Math.PI * r * (1 - ratio)}`}
        />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#0d2f2c" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="3.5" fill={color} />
      </svg>
      <div className="text-center font-mono">
        <p className="text-sm font-bold tabular-nums text-fg">
          {value.toFixed(1)}
          <span className="text-[10px] text-muted">{unit}</span>
        </p>
        <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
        <p className="text-[10px] font-medium" style={{ color }}>
          {sublabel}
        </p>
      </div>
    </div>
  );
}

export function ConsensusChart({
  outcomes,
  points,
  velocityPerMin,
  volume24h,
  totalRawVotes,
  verifiedPct,
  sybilsBlocked,
  reactions,
  onReact,
  mode,
  lang,
  pulseMode,
  onTogglePulse,
}: {
  outcomes: Outcome[];
  points: ChartPoint[];
  velocityPerMin: number;
  volume24h: number[];
  totalRawVotes: number;
  verifiedPct: number;
  sybilsBlocked: number;
  reactions: Array<{ emoji: string; label: string; count: number }>;
  onReact: (emoji: string) => void;
  mode: UiMode;
  lang: Language;
  pulseMode: boolean;
  onTogglePulse: () => void;
}) {
  const [chartMode, setChartMode] = useState<ChartMode>("race");
  const [showSuperLayer, setShowSuperLayer] = useState(true);
  const [soloId, setSoloId] = useState<string | null>(null);
  const [showGauges, setShowGauges] = useState(true);

  const ranked = useMemo(() => [...outcomes].sort((a, b) => b.pct - a.pct), [outcomes]);
  const leader = ranked[0];
  const runnerUp = ranked[1];
  const leadMargin = leader && runnerUp ? Math.max(0, leader.pct - runnerUp.pct) : 0;

  const superGap = leader ? Math.abs(leader.pct - leader.superPct) : 0;
  const hasAlphaDivergence = superGap >= 3.0;

  const activePoints = useMemo(
    () => (pulseMode ? points.slice(-6) : points.slice(-10)),
    [points, pulseMode],
  );

  const baselinePoint = points[0];
  const maxHist = Math.max(1, ...volume24h);
  const labelOf = (o: Outcome) => (lang === "hi" && o.labelHi ? o.labelHi : o.label);

  return (
    <div className="rounded border border-line bg-surface p-3.5 sm:p-4">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary glow-primary" />
          <h3 className="font-mono text-xs font-bold tracking-wider text-fg uppercase">
            {lang === "hi" ? "लाइव डोनट और मूविंग बार ग्राफ" : "Donut Share & Moving Bar Graph"}
          </h3>
          <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
            {pulseMode ? "5s PULSE ROOM" : "LIVE WIRE"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          <button
            type="button"
            onClick={onTogglePulse}
            className={`flex items-center gap-1 rounded border px-2 py-1 transition-colors ${
              pulseMode
                ? "border-accent bg-accent/20 text-accent font-bold"
                : "border-line bg-bg text-muted hover:text-fg"
            }`}
          >
            <Radio className="size-3" />
            {pulseMode ? "Pulse ON" : "Pulse 5s"}
          </button>

          <button
            type="button"
            onClick={() => setShowSuperLayer((v) => !v)}
            className={`flex items-center gap-1 rounded border px-2 py-1 transition-colors ${
              showSuperLayer
                ? "border-cyan bg-cyan/15 text-cyan font-semibold"
                : "border-line bg-bg text-muted hover:text-fg"
            }`}
            title="Show Top 5% Superforecaster target markers on bars"
          >
            <Sparkles className="size-3" />
            Top 5% Pin
          </button>

          <div className="flex rounded border border-line bg-bg p-0.5">
            {(
              [
                ["race", "Moving Bars", BarChart3],
                ["columns", "Time Bars", Layers],
                ["delta", "Swing", Activity],
              ] as const
            ).map(([id, text, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setChartMode(id)}
                className={`flex items-center gap-1 rounded-xs px-2 py-0.5 transition-colors ${
                  chartMode === id ? "bg-primary text-white font-bold" : "text-muted hover:text-fg"
                }`}
              >
                <Icon className="size-3" />
                <span className="hidden sm:inline">{text}</span>
              </button>
            ))}
          </div>

          {mode === "terminal" && (
            <button
              type="button"
              onClick={() => setShowGauges((v) => !v)}
              className={`rounded border px-2 py-1 ${
                showGauges ? "border-primary/50 text-primary bg-primary/10" : "border-line text-muted"
              }`}
            >
              Gauges
            </button>
          )}
        </div>
      </div>

      {/* Favoured Most by Votes Banner */}
      {leader && (
        <div className="mt-3 rounded border border-line/80 bg-bg/80 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded border border-primary/40 bg-primary/10 text-primary">
                <Award className="size-4" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                  <span className="uppercase tracking-wider text-muted">
                    {lang === "hi" ? "सबसे अधिक वोटों से आगे" : "Favoured Most by Votes"}
                  </span>
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 font-bold text-primary">
                    +{leadMargin.toFixed(1)}% LEAD MARGIN
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: leader.color }} />
                  <span className="text-sm font-bold text-fg">{labelOf(leader)}</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-primary">
                    {leader.pct.toFixed(1)}%
                  </span>
                  <span className="font-mono text-[11px] text-muted">
                    ({leader.rawVotes} verified calls)
                  </span>
                </div>
              </div>
            </div>

            {hasAlphaDivergence && (
              <div className="flex items-center gap-1.5 rounded border border-cyan/40 bg-cyan/10 px-2.5 py-1 font-mono text-[11px] text-cyan">
                <Flame className="size-3.5 shrink-0" />
                <span>
                  Smart-Money Divergence: Top 5% at{" "}
                  <strong>{leader.superPct.toFixed(1)}%</strong> ({superGap.toFixed(1)}% gap)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pro Terminal Dual Tachometers & Dynamic Volume Histogram */}
      {mode === "terminal" && showGauges && (
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <SemiCircleTachometer
            value={leader?.pct ?? 50}
            label="Consensus Bias"
            sublabel={leadMargin > 12 ? "Decisive Lead" : "Contested Race"}
            color="#ea580c"
            unit="%"
          />
          <SemiCircleTachometer
            value={Math.min(100, velocityPerMin)}
            label="Turnout Velocity"
            sublabel="Live SQLite Stream"
            color="#0284c7"
            unit=" / min"
          />
          <div className="flex flex-col justify-between rounded border border-line bg-bg/70 p-2.5 font-mono">
            <div className="flex items-center justify-between text-[10px] text-muted">
              <span className="uppercase tracking-wider">24h Ballot Velocity</span>
              <span className="font-bold text-primary tabular-nums">{totalRawVotes} total</span>
            </div>
            <div className="my-1.5 flex h-12 items-end gap-1">
              {volume24h.map((v, idx) => (
                <div
                  key={idx}
                  title={`${v} ballots`}
                  style={{ height: `${Math.max(12, Math.round((v / maxHist) * 100))}%` }}
                  className="flex-1 rounded-t-xs bg-primary/70 transition-all hover:bg-primary"
                />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-muted">
              <span>-12h</span>
              <span className="text-primary">Real Influx</span>
              <span>Now</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Interactive Donut (Left) + Moving Bar Graph (Right) */}
      <div className="mt-3 grid gap-3 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-5">
          <InteractiveConsensusDonut
            outcomes={outcomes}
            totalCalls={totalRawVotes}
            soloId={soloId}
            onSelectOutcome={setSoloId}
            lang={lang}
          />
        </div>

        {/* Right: Moving Bar Graph Arena */}
        <div className="flex min-w-0 flex-col justify-between rounded border border-line/80 bg-bg/75 p-3 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2 font-mono text-[10px] text-muted">
            <span className="font-bold uppercase tracking-wider text-fg">
              {chartMode === "race"
                ? "Live Moving Race Bars"
                : chartMode === "columns"
                  ? "Moving Time-Interval Bar Columns"
                  : "Momentum Swing vs Opening"}
            </span>
            {showSuperLayer && (
              <span className="text-cyan">◆ = Top 5% Superforecasters</span>
            )}
          </div>

          {chartMode === "race" && (
            <div className="my-2 flex-1 space-y-3">
              {ranked.map((o, idx) => {
                const isFaded = soloId !== null && soloId !== o.id;
                const startVal = baselinePoint?.crowd[o.id] ?? o.pct;
                const swing = Math.round((o.pct - startVal) * 10) / 10;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSoloId(soloId === o.id ? null : o.id)}
                    className={`block w-full text-left transition-opacity duration-300 ${
                      isFaded ? "opacity-30" : "opacity-100"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between font-mono text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-bold text-muted">
                          #{idx + 1}
                        </span>
                        <span className="truncate font-bold text-fg">{labelOf(o)}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold tabular-nums ${
                            swing >= 0 ? "text-primary" : "text-crimson"
                          }`}
                        >
                          {swing >= 0 ? `▲ +${swing.toFixed(1)}%` : `▼ ${swing.toFixed(1)}%`}
                        </span>
                        <span
                          className="font-extrabold tabular-nums text-xs"
                          style={{ color: o.color }}
                        >
                          {o.pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Moving Bar Track */}
                    <div className="relative h-6 w-full overflow-hidden rounded-md border border-line bg-surface shadow-inner">
                      <div
                        className="liquid-shimmer relative flex h-full items-center justify-end pr-2 transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.max(8, o.pct)}%`,
                          backgroundColor: o.color,
                        }}
                      >
                        <span className="font-mono text-[10px] font-bold text-white drop-shadow-xs tabular-nums">
                          {o.rawVotes} calls
                        </span>
                      </div>

                      {/* Top 5% Superforecaster Pin */}
                      {showSuperLayer && (
                        <div
                          title={`Top 5% Superforecasters: ${o.superPct.toFixed(1)}%`}
                          className="pointer-events-none absolute top-0 bottom-0 z-10 flex items-center transition-all duration-700"
                          style={{ left: `${Math.min(96, Math.max(2, o.superPct))}%` }}
                        >
                          <div className="h-full w-0.5 bg-fg/70" />
                          <span className="-ml-1.5 text-[10px] text-cyan drop-shadow">◆</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {chartMode === "columns" && (
            <div className="my-2 flex flex-1 flex-col justify-end">
              <div className="grid h-48 grid-cols-10 items-end gap-1.5 border-b border-line pb-2 pt-4">
                {activePoints.map((pt, colIdx) => (
                  <div key={pt.t} className="flex h-full flex-col items-center justify-end gap-0.5">
                    <div className="flex h-full w-full items-end gap-0.5">
                      {ranked.slice(0, 4).map((o) => {
                        const val = pt.crowd[o.id] ?? 0;
                        const isFaded = soloId !== null && soloId !== o.id;
                        return (
                          <div
                            key={o.id}
                            title={`${labelOf(o)}: ${val.toFixed(1)}%`}
                            className="flex-1 rounded-t-xs transition-all duration-500"
                            style={{
                              height: `${Math.max(4, val)}%`,
                              backgroundColor: o.color,
                              opacity: isFaded ? 0.2 : 0.9,
                            }}
                          />
                        );
                      })}
                    </div>
                    <span className="font-mono text-[9px] text-muted">
                      {colIdx === activePoints.length - 1 ? "NOW" : `T-${activePoints.length - 1 - colIdx}`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-3 font-mono text-[10px] text-muted">
                {ranked.slice(0, 4).map((o) => (
                  <span key={o.id} className="flex items-center gap-1">
                    <span className="size-2 rounded-xs" style={{ backgroundColor: o.color }} />
                    {o.id.toUpperCase()} {o.pct.toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {chartMode === "delta" && (
            <div className="my-2 flex-1 space-y-2.5">
              {ranked.map((o) => {
                const startVal = baselinePoint?.crowd[o.id] ?? o.pct;
                const swing = Math.round((o.pct - startVal) * 10) / 10;
                const barWidth = Math.min(100, Math.abs(swing) * 6 + 10);
                return (
                  <div key={o.id} className="rounded border border-line/70 bg-surface p-2 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-fg">{labelOf(o)}</span>
                      <span className={swing >= 0 ? "font-bold text-primary" : "font-bold text-crimson"}>
                        {swing >= 0 ? `+${swing.toFixed(1)}% Surge` : `${swing.toFixed(1)}% Drop`}
                      </span>
                    </div>
                    <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-bg">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: swing >= 0 ? o.color : "#e11d48",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-1 flex items-center justify-between border-t border-line/60 pt-2 font-mono text-[10px] text-muted">
            <span>Bars animate & shift live on every vote</span>
            <span className="text-primary font-semibold">Live SQLite Stream</span>
          </div>
        </div>
      </div>

      {/* Conviction Stream Funnel */}
      <div className="mt-3">
        <ConvictionStreamFunnel
          totalRawVotes={totalRawVotes}
          verifiedPct={verifiedPct}
          sybilsBlocked={sybilsBlocked}
        />
      </div>

      {/* Live Pulse Reaction Chips */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {reactions.map((r) => (
            <button
              key={r.emoji}
              type="button"
              onClick={() => onReact(r.emoji)}
              className="flex items-center gap-1.5 rounded-full border border-line bg-bg px-2.5 py-1 font-mono text-[11px] text-fg transition-colors hover:border-primary/60 hover:bg-primary/10"
            >
              <span>{r.emoji}</span>
              <span className="text-muted">{r.label}</span>
              <span className="font-bold text-primary tabular-nums">{r.count}</span>
            </button>
          ))}
        </div>

        {soloId && (
          <button
            type="button"
            onClick={() => setSoloId(null)}
            className="font-mono text-[11px] text-primary underline hover:text-fg"
          >
            Reset Donut Filter
          </button>
        )}
      </div>
    </div>
  );
}
