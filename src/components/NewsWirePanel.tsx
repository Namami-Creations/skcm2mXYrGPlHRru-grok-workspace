import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Newspaper, RefreshCw, Search } from "lucide-react";
import { ExitPollComparatorPanel } from "@/components/ExitPollComparatorPanel";
import type { FactCheckResult, Language } from "@/lib/types";

export function NewsWirePanel({
  marketId,
  lang = "en",
}: {
  marketId: string;
  lang?: Language;
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchNews(searchQuery = query) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/news?marketId=${encodeURIComponent(marketId)}&q=${encodeURIComponent(searchQuery)}`,
      );
      if (res.ok) {
        const data = (await res.json()) as FactCheckResult;
        setResult(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchNews("");
  }, [marketId]);

  return (
    <div className="rounded border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="size-4 text-primary" />
            <h3 className="font-mono text-xs font-bold tracking-wider text-fg uppercase">
              Real-Time Google News & Oracle Fact-Check Wire
            </h3>
            <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary">
              CITED SOURCES
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Live news grounding + official resolution oracle rules side-by-side with crowd consensus.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchNews(query)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 font-mono text-xs font-bold text-bg hover:brightness-110 disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Run Fact-Check
        </button>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void fetchNews(query);
        }}
        className="mt-3 flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 size-3.5 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Google News India (e.g. 'UP 2027', 'RBI repo rate', 'IPL dew')..."
            className="w-full rounded border border-line bg-bg py-2 pr-3 pl-9 font-mono text-xs text-fg outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          className="rounded border border-line bg-bg px-3 font-mono text-xs text-fg hover:border-primary"
        >
          Search
        </button>
      </form>

      {/* Reality Check Verdict Matrix */}
      {result && (
        <>
          <div className="mt-3 rounded border border-primary/40 bg-bg/90 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 font-bold text-primary">
                <CheckCircle2 className="size-4" />
                CROWD CONSENSUS VS. OFFICIAL ORACLE
              </span>
              <span className="text-cyan">
                {result.divergenceLabel} · {result.confidencePct}% Grounded
              </span>
            </div>

            <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
              <div className="rounded border border-line/70 bg-surface/60 p-2.5">
                <p className="font-mono text-[10px] uppercase text-muted">Market Consensus Leader</p>
                <p className="mt-1 text-sm font-bold text-primary">
                  {result.leaderLabel} ({result.leaderPct.toFixed(1)}%)
                </p>
                <p className="mt-1 text-xs text-muted">{result.summary}</p>
              </div>
              <div className="rounded border border-line/70 bg-surface/60 p-2.5">
                <p className="font-mono text-[10px] uppercase text-muted">Designated Resolution Oracle</p>
                <p className="mt-1 text-sm font-bold text-fg">{result.oracleName}</p>
                <p className="mt-1 text-xs text-muted">{result.oracleRule}</p>
              </div>
            </div>
          </div>

          {/* Cited Articles */}
          <div className="mt-3 space-y-2.5">
            {result.articles.map((art) => (
              <div key={art.id} className="rounded border border-line bg-bg/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-fg">{art.source}</span>
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-cyan underline"
                    >
                      {art.domain}
                      <ExternalLink className="size-3" />
                    </a>
                    <span className="text-muted">· {art.publishedAgo}</span>
                  </div>
                  <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                    {art.tag}
                  </span>
                </div>

                <h4 className="mt-1.5 text-sm font-semibold text-fg">{art.title}</h4>
                <p className="mt-1 text-xs text-muted">{art.snippet}</p>

                <ul className="mt-2 space-y-1 border-t border-line/60 pt-2 font-mono text-[11px] text-primary/90">
                  {art.verifiedFacts.map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Exit Poll & Pollster Accuracy Comparator */}
      <ExitPollComparatorPanel lang={lang} />
    </div>
  );
}
