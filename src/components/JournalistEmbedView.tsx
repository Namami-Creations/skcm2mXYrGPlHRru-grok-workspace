import { useEffect, useState } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import type { MarketDetailResponse } from "@/lib/types";

export function JournalistEmbedView({ marketId }: { marketId: string }) {
  const [detail, setDetail] = useState<MarketDetailResponse | null>(null);

  useEffect(() => {
    fetch(`/api/markets/${encodeURIComponent(marketId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setDetail(d);
      })
      .catch(() => {});
  }, [marketId]);

  const market = detail?.market;

  if (!market) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg p-4 font-mono text-xs text-muted">
        Loading Oracle Black Live Embed...
      </div>
    );
  }

  const ranked = [...market.outcomes].sort((a, b) => b.pct - a.pct);

  return (
    <div className="min-h-dvh bg-bg p-3 text-fg">
      <div className="mx-auto max-w-xl rounded-lg border border-primary/40 bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
          <span className="flex items-center gap-1.5 font-bold text-primary">
            <span className="size-2 rounded-full bg-crimson animate-pulse" />
            ORACLE // BLACK · LIVE CONSENSUS EMBED
          </span>
          <span className="flex items-center gap-1 text-muted">
            <ShieldCheck className="size-3 text-primary" />
            {market.verifiedPct}% Human · {market.totalRawVotes} Calls
          </span>
        </div>

        <h1 className="mt-2 text-sm font-extrabold leading-snug text-fg sm:text-base">
          {market.question}
        </h1>

        <div className="mt-3 space-y-2">
          {ranked.slice(0, 4).map((o) => (
            <div key={o.id}>
              <div className="flex justify-between font-mono text-[11px]">
                <span className="font-semibold text-fg">{o.label}</span>
                <span className="font-bold tabular-nums" style={{ color: o.color }}>
                  {o.pct.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(4, o.pct)}%`, backgroundColor: o.color }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-line pt-2 font-mono text-[10px]">
          <span className="text-muted">Zero-Money · Anti-IT-Cell SHA-256 PoW</span>
          <a
            href={`/?poll=${encodeURIComponent(market.id)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 font-bold text-primary hover:underline"
          >
            Cast 1-Tap Vote <ArrowUpRight className="size-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
