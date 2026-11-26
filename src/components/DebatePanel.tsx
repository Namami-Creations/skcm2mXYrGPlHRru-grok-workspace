import { useState } from "react";
import { Award, Flame, MessageSquare, ShieldCheck, Trophy } from "lucide-react";
import type { DebatePost, LeaderboardEntry, Outcome, UserProfile } from "@/lib/types";

export function DebatePanel({
  marketId,
  outcomes,
  debates,
  leaderboard,
  token,
  user,
  onPosted,
}: {
  marketId: string;
  outcomes: Outcome[];
  debates: DebatePost[];
  leaderboard: LeaderboardEntry[];
  token: string;
  user?: UserProfile | null;
  onPosted: () => void;
}) {
  const [outcomeId, setOutcomeId] = useState(outcomes[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId,
          token,
          outcomeId: outcomeId || outcomes[0]?.id,
          body,
        }),
      });
      setBody("");
      onPosted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Left: Debate Rationales */}
      <div className="space-y-3 rounded border border-line bg-surface p-4 lg:col-span-7">
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-primary" />
            <h3 className="font-mono text-xs font-bold tracking-wider text-fg uppercase">
              Verified Forecaster Rationales ({debates.length})
            </h3>
          </div>
          <span className="font-mono text-[10px] text-muted">Accuracy-Badged Calls</span>
        </div>

        <form onSubmit={submitPost} className="space-y-2 rounded border border-line bg-bg p-3">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-muted">Backing:</span>
            <select
              value={outcomeId || outcomes[0]?.id}
              onChange={(e) => setOutcomeId(e.target.value)}
              className="rounded border border-line bg-surface px-2 py-1 text-fg outline-none focus:border-primary"
            >
              {outcomes.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            placeholder="Share your data-backed rationale (no hype or spam)..."
            className="w-full rounded border border-line bg-surface p-2 text-xs text-fg outline-none placeholder:text-muted focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy || !body.trim()}
            className="rounded bg-primary px-3 py-1.5 font-mono text-xs font-bold text-bg hover:brightness-110 disabled:opacity-40"
          >
            {busy ? "Posting..." : "Post Rationale"}
          </button>
        </form>

        <div className="space-y-2.5">
          {debates.map((d) => {
            const target = outcomes.find((o) => o.id === d.outcomeId);
            return (
              <div key={d.id} className="rounded border border-line/80 bg-bg/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-fg">@{d.handle}</span>
                    {d.tier === "verified" && (
                      <ShieldCheck className="size-3.5 text-primary" />
                    )}
                    <span className="rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {d.badge}
                    </span>
                  </div>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: `${target?.color ?? "#2fce8a"}22`,
                      color: target?.color ?? "#2fce8a",
                    }}
                  >
                    {target?.label ?? d.outcomeId}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-fg/90">{d.body}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Seasonal Reputation League */}
      <div className="rounded border border-line bg-surface p-4 lg:col-span-5">
        <div className="flex items-center gap-2 border-b border-line pb-2.5">
          <Trophy className="size-4 text-gold" />
          <h3 className="font-mono text-xs font-bold tracking-wider text-fg uppercase">
            Seasonal Reputation League
          </h3>
        </div>
        <p className="mt-2 text-xs text-muted">
          Zero money lost. Top calibrated minds earn verifiable accuracy badges and 1.0x Superforecaster weighting.
        </p>

        {user && (
          <div className="mt-3 rounded border border-primary/40 bg-bg/90 p-2.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-fg">@{user.handle}</span>
              <span className="flex items-center gap-1 font-bold text-accent">
                <Flame className="size-3.5" /> {user.streakDays}d Streak
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {(user.badges?.length ? user.badges : ["New Challenger"]).map((b) => (
                <span
                  key={b}
                  className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 space-y-2">
          {leaderboard.map((entry, idx) => (
            <div
              key={entry.handle}
              className="flex items-center justify-between rounded border border-line/70 bg-bg/80 p-2.5 font-mono text-xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gold">#{idx + 1}</span>
                  <span className="truncate font-bold text-fg">@{entry.handle}</span>
                  <Award className="size-3.5 shrink-0 text-primary" />
                </div>
                <p className="mt-0.5 truncate text-[10px] text-primary">{entry.badge}</p>
                <p className="text-[10px] text-muted">{entry.league}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-bold text-fg tabular-nums">{entry.accuracyPct.toFixed(1)}% Acc</p>
                <p className="text-[10px] text-muted tabular-nums">{entry.rep} REP</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
