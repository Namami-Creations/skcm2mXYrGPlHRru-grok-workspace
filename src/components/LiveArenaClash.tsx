import { Crown, Flame, Swords, Zap } from "lucide-react";
import type { ChartPoint, Language, Outcome } from "@/lib/types";

/**
 * Individual Contender Goal-Progress Donut Ring:
 * Shows each contender's live movement toward the 50% majority winning goal
 * (or 100% full consensus) with smooth stroke transitions on every vote.
 */
function ContenderGoalDonut({
  pct,
  color,
  isSurging,
}: {
  pct: number;
  color: string;
  isSurging: boolean;
}) {
  const r = 22;
  const cx = 28;
  const cy = 28;
  const circ = 2 * Math.PI * r;
  // Scale progress toward a 50% majority goal (so 50%+ fills the goal ring, clamped 0..100%)
  const goalProgress = Math.min(100, (pct / 50) * 100);
  const dashLen = (goalProgress / 100) * circ;

  return (
    <div className="relative flex size-14 shrink-0 items-center justify-center">
      <svg viewBox="0 0 56 56" className="size-14 overflow-visible">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#dff1ee" strokeWidth="5.5" />
        {/* Pulsing halo when surging */}
        {isSurging && (
          <circle
            cx={cx}
            cy={cy}
            r={r + 4}
            fill="none"
            stroke={color}
            strokeOpacity="0.35"
            strokeWidth="2"
            className="animate-ping"
          />
        )}
        {/* Animated progress arc moving toward goal */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeDasharray={`${dashLen} ${circ - dashLen}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className="absolute font-mono text-[11px] font-extrabold tabular-nums"
        style={{ color }}
      >
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

/**
 * Visual-first "Fighting to Win" Tug-of-War Clash Bar + Living Contender Goal Donuts.
 */
export function LiveArenaClash({
  outcomes,
  points,
  myOutcomeId,
  castingOutcomeId,
  recentSurgeId,
  lang,
  onVote,
  onSimulateSurge,
  surging,
}: {
  outcomes: Outcome[];
  points: ChartPoint[];
  myOutcomeId: string | null;
  castingOutcomeId: string | null;
  recentSurgeId: string | null;
  lang: Language;
  onVote: (outcomeId: string) => void;
  onSimulateSurge: () => void;
  surging: boolean;
}) {
  const ranked = [...outcomes].sort((a, b) => b.pct - a.pct);
  const first = ranked[0];
  const second = ranked[1];
  const labelOf = (o: Outcome) => (lang === "hi" && o.labelHi ? o.labelHi : o.label);

  const topPairSum = (first?.pct ?? 50) + (second?.pct ?? 50);
  const frontierPct =
    topPairSum > 0 ? Math.round(((first?.pct ?? 50) / topPairSum) * 1000) / 10 : 50;

  return (
    <div className="space-y-3">
      {/* 1. Head-to-Head Tug-of-War Battlefront */}
      {first && second && (
        <div className="rounded-lg border border-line bg-bg/80 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 font-bold" style={{ color: first.color }}>
              <Crown className="size-3.5" />
              <span>{first.id.toUpperCase()}</span>
              <span className="text-sm tabular-nums">{first.pct.toFixed(1)}%</span>
            </div>

            <button
              type="button"
              onClick={onSimulateSurge}
              disabled={surging}
              className="flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary transition-all hover:bg-primary hover:text-white active:scale-95 disabled:opacity-50"
              title="Watch live crowd votes clash in real time"
            >
              <Zap className={`size-3 ${surging ? "animate-spin" : ""}`} />
              {surging ? "CROWD SURGING..." : "SIMULATE LIVE CROWD"}
            </button>

            <div className="flex items-center gap-1.5 font-bold" style={{ color: second.color }}>
              <span className="text-sm tabular-nums">{second.pct.toFixed(1)}%</span>
              <span>{second.id.toUpperCase()}</span>
              <Swords className="size-3.5" />
            </div>
          </div>

          <div className="relative mt-2 h-5 w-full overflow-hidden rounded-full border border-line bg-surface shadow-inner">
            <div
              className="liquid-shimmer relative float-left h-full transition-all duration-700 ease-out"
              style={{
                width: `${frontierPct}%`,
                backgroundColor: first.color,
              }}
            />
            <div
              className="liquid-shimmer relative float-right h-full transition-all duration-700 ease-out"
              style={{
                width: `${100 - frontierPct}%`,
                backgroundColor: second.color,
                opacity: 0.88,
              }}
            />
            <div
              className="clash-spark pointer-events-none absolute top-1/2 z-10 flex size-6 items-center justify-center rounded-full border-2 border-white bg-fg text-[10px] font-bold text-white shadow-md transition-all duration-700"
              style={{ left: `${frontierPct}%` }}
            >
              ⚡
            </div>
          </div>
        </div>
      )}

      {/* 2. Per-Contender Goal-Progress Donut Tiles */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map((o, idx) => {
          const isMine = myOutcomeId === o.id;
          const isBusy = castingOutcomeId === o.id;
          const isSurging = recentSurgeId === o.id;
          const isLeader = idx === 0;
          const isChallenger = idx === 1;
          const label = labelOf(o);
          const goalPct = Math.min(100, Math.round((o.pct / 50) * 100));
          const baseline = points[0]?.crowd[o.id] ?? o.pct;
          const delta = Math.round((o.pct - baseline) * 10) / 10;

          return (
            <button
              key={o.id}
              type="button"
              disabled={Boolean(myOutcomeId) || Boolean(castingOutcomeId)}
              onClick={() => onVote(o.id)}
              className={`group relative overflow-hidden rounded-lg border p-3 text-left transition-all duration-300 ${
                isLeader ? "tile-breathe" : ""
              } ${
                isMine
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : isSurging
                    ? "border-accent bg-accent/5 ring-2 ring-accent/30"
                    : "border-line bg-surface hover:border-primary/70 hover:shadow-md"
              } ${myOutcomeId && !isMine ? "opacity-80" : ""}`}
            >
              {/* Subtle bottom progress bar toward goal */}
              <div
                className="pointer-events-none absolute bottom-0 left-0 h-1 transition-all duration-700 ease-out"
                style={{ width: `${goalPct}%`, backgroundColor: o.color }}
              />

              {isSurging && (
                <span
                  className="animate-float-up pointer-events-none absolute top-2 right-3 z-20 rounded-full px-2 py-0.5 font-mono text-[10px] font-extrabold text-white shadow"
                  style={{ backgroundColor: o.color }}
                >
                  +1 VOTE!
                </span>
              )}

              <div className="relative z-10 flex items-center gap-3">
                {/* Contender's Individual Goal Donut */}
                <ContenderGoalDonut pct={o.pct} color={o.color} isSurging={isSurging} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-bold text-fg">{label}</span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                    {isLeader ? (
                      <span
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-bold text-white"
                        style={{ backgroundColor: o.color }}
                      >
                        <Crown className="size-2.5" /> LEADING
                      </span>
                    ) : isChallenger ? (
                      <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 font-bold text-accent">
                        <Flame className="size-2.5" /> CHASING
                      </span>
                    ) : (
                      <span className="rounded bg-bg px-1.5 py-0.5 text-muted">#{idx + 1}</span>
                    )}

                    <span
                      className={`font-bold tabular-nums ${
                        delta >= 0 ? "text-primary" : "text-crimson"
                      }`}
                    >
                      {delta >= 0 ? `▲ +${delta}%` : `▼ ${delta}%`}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted">
                    <span>{isMine ? "✓ YOUR CALL" : isBusy ? "Locking..." : `${o.rawVotes} calls`}</span>
                    <span className="tabular-nums">{goalPct}% to 50% goal</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
