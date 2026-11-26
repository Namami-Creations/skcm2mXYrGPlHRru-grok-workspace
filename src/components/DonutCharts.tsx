import { useState } from "react";
import type { CityBreakdown, Language, Outcome } from "@/lib/types";

/**
 * 1. Interactive Segmented Rounded-Gap Donut Chart (inspired by Image 2 "Monthly activity")
 *    - Clicking or hovering any arc highlights/isolates that party/outcome across the entire dashboard.
 */
export function InteractiveConsensusDonut({
  outcomes,
  totalCalls,
  soloId,
  onSelectOutcome,
  lang,
}: {
  outcomes: Outcome[];
  totalCalls: number;
  soloId: string | null;
  onSelectOutcome: (id: string | null) => void;
  lang: Language;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const sorted = [...outcomes].sort((a, b) => b.pct - a.pct);
  const focusId = hoveredId ?? soloId;
  const focused = sorted.find((o) => o.id === focusId) ?? sorted[0];

  const cx = 100;
  const cy = 100;
  const r = 72;
  const circumference = 2 * Math.PI * r;
  const gapDeg = sorted.length > 1 ? 6 : 0;

  let cumulativeDeg = -90;
  const segments = sorted.map((o) => {
    const rawDeg = (o.pct / 100) * 360;
    const arcDeg = Math.max(0, rawDeg - gapDeg);
    const startDeg = cumulativeDeg + gapDeg / 2;
    cumulativeDeg += rawDeg;
    const dashLen = (arcDeg / 360) * circumference;
    const dashGap = circumference - dashLen;
    return {
      outcome: o,
      startDeg,
      dashLen,
      dashGap,
    };
  });

  const labelOf = (o: Outcome) => (lang === "hi" && o.labelHi ? o.labelHi : o.label);

  return (
    <div className="flex flex-col items-center justify-between rounded border border-line/80 bg-bg/75 p-3">
      <div className="flex w-full items-center justify-between font-mono text-[10px] text-muted">
        <span className="uppercase tracking-wider">Vote Share Donut</span>
        <span className="text-primary">Click slice to isolate</span>
      </div>

      <div className="relative my-2 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="size-48 overflow-visible sm:size-52">
          {/* Outer Breathing Halo */}
          <circle
            cx={cx}
            cy={cy}
            r={r + 14}
            fill="none"
            stroke={focused?.color ?? "#0d9488"}
            strokeOpacity="0.22"
            strokeWidth="2"
            className="animate-pulse"
          />
          {/* Outer Battleground Share Donut Track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#dff1ee" strokeWidth="18" />
          {segments.map(({ outcome, startDeg, dashLen, dashGap }) => {
            if (outcome.pct <= 0) return null;
            const isActive = focusId === outcome.id;
            const isFaded = focusId !== null && !isActive;
            return (
              <circle
                key={outcome.id}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={outcome.color}
                strokeWidth={isActive ? 22 : 17}
                strokeLinecap="round"
                strokeDasharray={`${dashLen} ${dashGap}`}
                transform={`rotate(${startDeg} ${cx} ${cy})`}
                opacity={isFaded ? 0.28 : 1}
                className="cursor-pointer transition-all duration-500 ease-out"
                onMouseEnter={() => setHoveredId(outcome.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectOutcome(soloId === outcome.id ? null : outcome.id)}
              />
            );
          })}

          {/* Inner Concentric Goal-Race Rings for Top 2 Contenders (Image reference style) */}
          {sorted.slice(0, 2).map((o, idx) => {
            const innerR = 49 - idx * 9;
            const innerCirc = 2 * Math.PI * innerR;
            const goalPct = Math.min(100, (o.pct / 50) * 100);
            const innerLen = (goalPct / 100) * innerCirc;
            return (
              <g key={`inner-${o.id}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={innerR}
                  fill="none"
                  stroke="#e6f6f3"
                  strokeWidth="5"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={innerR}
                  fill="none"
                  stroke={o.color}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeOpacity="0.85"
                  strokeDasharray={`${innerLen} ${innerCirc - innerLen}`}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  className="transition-all duration-700 ease-out"
                />
              </g>
            );
          })}
        </svg>

        {/* Center Battleground Readout */}
        {focused && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className="font-mono text-[9px] font-bold uppercase tracking-wider"
              style={{ color: focused.color }}
            >
              {focused.id.toUpperCase()}
            </span>
            <span className="font-mono text-lg font-extrabold leading-tight tabular-nums text-fg">
              {focused.pct.toFixed(1)}%
            </span>
            <span className="font-mono text-[9px] text-muted tabular-nums">
              {focused.rawVotes} / {totalCalls}
            </span>
          </div>
        )}
      </div>

      {/* Compact Legend with Dotted Leaders (Image 1 & 2 fusion) */}
      <div className="w-full space-y-1.5 font-mono text-[11px]">
        {sorted.map((o) => {
          const isSelected = soloId === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onMouseEnter={() => setHoveredId(o.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectOutcome(isSelected ? null : o.id)}
              className={`flex w-full items-center gap-2 rounded px-1.5 py-0.5 text-left transition-colors ${
                isSelected ? "bg-primary/15 text-fg" : "hover:bg-surface"
              }`}
            >
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: o.color }} />
              <span className="truncate text-fg/90">{labelOf(o)}</span>
              <span className="flex-1 border-b border-dotted border-line/80" />
              <span className="font-bold tabular-nums text-fg">{o.pct.toFixed(1)}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 2. Glowing Conviction Stream Funnel (inspired by Image 1 "Details" horizontal stream graph)
 */
export function ConvictionStreamFunnel({
  totalRawVotes,
  verifiedPct,
  sybilsBlocked,
}: {
  totalRawVotes: number;
  verifiedPct: number;
  sybilsBlocked: number;
}) {
  const engagedPct = Math.min(98, Math.round(verifiedPct));
  const verified1xPct = Math.max(12, Math.round(verifiedPct * 0.78));
  const stages = [
    { label: "Opened Battle", val: `${totalRawVotes + sybilsBlocked}`, pct: 100, color: "#2fce8a" },
    { label: "Passed PoW Shield", val: `${totalRawVotes}`, pct: engagedPct, color: "#fbbf24" },
    { label: "OTP Verified 1.0x", val: `${Math.round((totalRawVotes * verifiedPct) / 100)}`, pct: verified1xPct, color: "#f97316" },
  ];

  return (
    <div className="rounded border border-line/80 bg-bg/75 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
        <span className="uppercase tracking-wider text-muted">
          Voter Verification & Conviction Stream
        </span>
        <span className="text-primary">Zero-Bot Funnel</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 font-mono">
        {stages.map((s) => (
          <div key={s.label}>
            <p className="text-[10px] text-muted">{s.label}</p>
            <p className="text-sm font-bold text-fg tabular-nums">
              {s.val} <span className="text-[10px] text-primary">({s.pct}%)</span>
            </p>
          </div>
        ))}
      </div>

      <svg viewBox="0 0 600 90" className="mt-2 h-20 w-full">
        <defs>
          <linearGradient id="streamGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2fce8a" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Outer soft glow band */}
        <path
          d="M 10,36 C 140,36 180,18 300,18 C 420,18 460,6 590,6 L 590,84 C 460,84 420,72 300,72 C 180,72 140,54 10,54 Z"
          fill="url(#streamGrad)"
          opacity="0.22"
        />
        {/* Core stream band */}
        <path
          d="M 10,41 C 140,41 180,30 300,30 C 420,30 460,22 590,22 L 590,68 C 460,68 420,60 300,60 C 180,60 140,49 10,49 Z"
          fill="url(#streamGrad)"
          opacity="0.8"
        />
        {[80, 300, 520].map((x, idx) => (
          <g key={x}>
            <line x1={x} y1="6" x2={x} y2="84" stroke="#0d2f2c" strokeOpacity="0.25" strokeDasharray="3 3" />
            <rect x={x - 22} y="2" width="44" height="16" rx="8" fill="#ffffff" stroke="#cce6e1" />
            <text
              x={x}
              y="13"
              textAnchor="middle"
              fill="#0d2f2c"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              {stages[idx].pct}%
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * 3. Overlapping City Bubble Cluster (inspired by Image 2 "Servers" overlapping circles)
 *    + 240-Degree Trust Arc (inspired by Image 1 "Borrowers by State")
 */
export function CityBubbleAndArcRow({
  cities,
  outcomes,
  onSelectCity,
  selectedCity,
}: {
  cities: CityBreakdown[];
  outcomes: Outcome[];
  onSelectCity: (city: string) => void;
  selectedCity?: string;
}) {
  const top3 = cities.slice(0, 3);
  if (top3.length === 0) return null;

  const totalTop3Votes = top3.reduce((s, c) => s + c.totalVotes, 0);
  const avgVerified = Math.round(
    top3.reduce((s, c) => s + c.verifiedSharePct, 0) / Math.max(1, top3.length),
  );

  // 240-degree thin gradient arc
  const r = 46;
  const cx = 64;
  const cy = 60;
  const arcLen = (240 / 360) * 2 * Math.PI * r;
  const fullCirc = 2 * Math.PI * r;
  const filledLen = (avgVerified / 100) * arcLen;

  const bubbleCoords = [
    { cx: 88, cy: 76, r: 46, color: "#2fce8a" },
    { cx: 146, cy: 52, r: 34, color: "#f97316" },
    { cx: 138, cy: 102, r: 26, color: "#38bdf8" },
  ];

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {/* Left: 240° Arc Donut + Dotted Leader Breakdown */}
      <div className="flex items-center gap-4 rounded border border-line/80 bg-bg/80 p-3">
        <div className="relative shrink-0">
          <svg viewBox="0 0 128 112" className="h-24 w-28">
            <defs>
              <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2fce8a" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#dff1ee"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${arcLen} ${fullCirc - arcLen}`}
              transform={`rotate(150 ${cx} ${cy})`}
            />
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${filledLen} ${fullCirc - filledLen}`}
              transform={`rotate(150 ${cx} ${cy})`}
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-1 font-mono">
            <span className="text-base font-extrabold text-fg tabular-nums">{totalTop3Votes}</span>
            <span className="text-[9px] text-muted">Top 3 Calls</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5 font-mono text-[11px]">
          <p className="text-[10px] uppercase text-muted">Top Cities by Volume</p>
          {top3.map((c, idx) => {
            const dom = outcomes.find((o) => o.id === c.dominantOutcomeId);
            return (
              <button
                key={c.city}
                type="button"
                onClick={() => onSelectCity(c.city)}
                className={`flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left ${
                  selectedCity === c.city ? "bg-primary/15" : "hover:bg-surface"
                }`}
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: bubbleCoords[idx]?.color ?? "#2fce8a" }}
                />
                <span className="truncate text-fg">{c.city}</span>
                <span className="flex-1 border-b border-dotted border-line" />
                <span className="font-bold text-primary tabular-nums">
                  {dom?.id.toUpperCase()} {(c.shares[c.dominantOutcomeId] ?? 0).toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Overlapping City Bubble Cluster */}
      <div className="flex items-center justify-between rounded border border-line/80 bg-bg/80 p-3">
        <div className="font-mono">
          <p className="text-[10px] uppercase text-muted">Battleground Clusters</p>
          <p className="mt-1 text-xs text-fg/90">Click any city bubble to inspect local split</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted">
            {top3.map((c, idx) => (
              <span key={c.city} className="flex items-center gap-1">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: bubbleCoords[idx]?.color }}
                />
                {c.city}
              </span>
            ))}
          </div>
        </div>

        <svg viewBox="0 0 210 135" className="h-28 w-44 shrink-0">
          {top3.map((c, idx) => {
            const b = bubbleCoords[idx];
            if (!b) return null;
            const leadPct = c.shares[c.dominantOutcomeId] ?? 0;
            return (
              <g
                key={c.city}
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => onSelectCity(c.city)}
              >
                <circle
                  cx={b.cx}
                  cy={b.cy}
                  r={b.r}
                  fill={b.color}
                  fillOpacity="0.22"
                  stroke={b.color}
                  strokeWidth={selectedCity === c.city ? 2.5 : 1.5}
                />
                <text
                  x={b.cx}
                  y={b.cy - 2}
                  textAnchor="middle"
                  fill="#0d2f2c"
                  fontSize={idx === 0 ? "13" : "11"}
                  fontWeight="bold"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {leadPct.toFixed(0)}%
                </text>
                <text
                  x={b.cx}
                  y={b.cy + 11}
                  textAnchor="middle"
                  fill="#4b746f"
                  fontSize="8.5"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {c.city}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
