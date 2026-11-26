import { useState } from "react";
import { Database, Download, Megaphone, PlusCircle, Scale, Terminal } from "lucide-react";
import type { MarketSummary } from "@/lib/types";

export function TerminalProPanel({
  market,
  sseLogs,
  onCampaignCreated,
  onBlackoutToggled,
}: {
  market: MarketSummary;
  sseLogs: string[];
  onCampaignCreated: (newMarketId: string) => void;
  onBlackoutToggled?: () => void;
}) {
  const [brandName, setBrandName] = useState("");
  const [question, setQuestion] = useState("");
  const [region, setRegion] = useState("Tier-2 UP Cities");
  const [optionsText, setOptionsText] = useState("Option A, Option B, Option C");
  const [creating, setCreating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [togglingBlackout, setTogglingBlackout] = useState(false);

  async function toggleBlackout() {
    setTogglingBlackout(true);
    try {
      await fetch(`/api/markets/${encodeURIComponent(market.id)}/blackout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !market.blackoutActive }),
      });
      onBlackoutToggled?.();
    } finally {
      setTogglingBlackout(false);
    }
  }

  async function launchCampaign(e: React.FormEvent) {
    e.preventDefault();
    const opts = optionsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!brandName.trim() || !question.trim() || opts.length < 2) return;
    setCreating(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/sponsored", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          question,
          targetRegion: region,
          options: opts,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatusMsg(`Launched live Ask India campaign (${data.marketId})!`);
        setBrandName("");
        setQuestion("");
        onCampaignCreated(data.marketId);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Level-2 Consensus Depth & Real SSE Wire */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-line bg-surface p-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="flex items-center gap-1.5 font-bold text-primary uppercase">
              <Database className="size-4" />
              Weighted Consensus Depth
            </span>
            <button
              type="button"
              disabled={togglingBlackout}
              onClick={() => void toggleBlackout()}
              className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold ${
                market.blackoutActive
                  ? "border-crimson bg-crimson/15 text-crimson"
                  : "border-line bg-bg text-muted hover:text-fg"
              }`}
              title="Toggle ECI Section 126 48-hour Poll Blackout preview"
            >
              <Scale className="size-3" />
              {market.blackoutActive ? "ECI 48h Blackout: ON" : "ECI Sec 126 Guard"}
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {market.outcomes.map((o) => (
              <div key={o.id} className="rounded border border-line/60 bg-bg p-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-fg">{o.label}</span>
                  <span className="font-bold text-primary">{o.pct.toFixed(1)}%</span>
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted">
                  <span>Raw Ballots: {o.rawVotes}</span>
                  <span>Human-Weighted: {o.weightedVotes}</span>
                  <span className="text-cyan">Top 5%: {o.superPct.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-line bg-surface p-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="flex items-center gap-1.5 font-bold text-cyan uppercase">
              <Terminal className="size-4" />
              B2B Sub-Second SSE Wire ($5,000/mo Tier)
            </span>
            <a
              href={`/api/export/${market.id}?format=csv`}
              className="flex items-center gap-1 rounded border border-primary/50 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary hover:bg-primary/20"
            >
              <Download className="size-3" />
              Export City CSV
            </a>
          </div>

          <div className="mt-3 h-44 overflow-y-auto rounded border border-line bg-[#e8f6f4] p-2.5 text-[11px] leading-relaxed text-[#0d2f2c]">
            <p className="text-muted">// Connected to live EventSource /api/stream</p>
            {sseLogs.length === 0 ? (
              <p className="mt-1 text-muted">
                Waiting for live ballot or reaction ticks... Cast a vote to see real-time SSE JSON frames.
              </p>
            ) : (
              sseLogs.map((log, i) => (
                <p key={i} className="mt-1 break-all">
                  {log}
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2. Ask India Sponsored Pulse Studio */}
      <div className="rounded border border-accent/40 bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
          <div className="flex items-center gap-2">
            <Megaphone className="size-4 text-accent" />
            <h3 className="font-mono text-xs font-bold tracking-wider text-fg uppercase">
              "Ask India" Sponsored Pulse Studio
            </h3>
            <span className="rounded bg-accent/15 px-2 py-0.5 font-mono text-[10px] font-bold text-accent">
              ₹4,20,000+ / Campaign
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted">
            Geo-fenced consumer & policy research with instant CSV/JSON export
          </span>
        </div>

        <form onSubmit={launchCampaign} className="mt-3 grid gap-3 font-mono text-xs sm:grid-cols-2">
          <div>
            <label className="block text-[10px] uppercase text-muted">Sponsor Brand / Media House</label>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Bharat EV Insights"
              className="mt-1 w-full rounded border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-muted">Target Region / Cohort</label>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. Tier-2 UP Cities"
              className="mt-1 w-full rounded border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-accent"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase text-muted">Sponsored Question</label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Which broadband fiber provider gives best uptime in Lucknow & Kanpur?"
              className="mt-1 w-full rounded border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-accent"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase text-muted">Options (Comma Separated)</label>
            <input
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-accent"
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-1.5 rounded bg-accent px-4 py-2 font-bold text-bg hover:brightness-110 disabled:opacity-50"
            >
              <PlusCircle className="size-4" />
              {creating ? "Publishing..." : "Publish Live Sponsored Poll"}
            </button>
            {statusMsg && <span className="text-primary">{statusMsg}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
