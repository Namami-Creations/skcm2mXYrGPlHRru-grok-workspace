import { Check, Code2, Copy, Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { downloadCardPng, renderPredictionCardDataUrl } from "@/lib/shareCard";
import type { CityBreakdown, Language, MarketSummary, UserProfile } from "@/lib/types";

export function BattlegroundModal({
  market,
  user,
  topCity,
  lang = "en",
  onClose,
}: {
  market: MarketSummary;
  user?: UserProfile | null;
  topCity?: CityBreakdown;
  lang?: Language;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [cardPngUrl, setCardPngUrl] = useState<string>("");

  const sorted = [...market.outcomes].sort((a, b) => b.pct - a.pct);
  const first = sorted[0];
  const second = sorted[1];
  const myOutcome = market.myOutcomeId
    ? market.outcomes.find((o) => o.id === market.myOutcomeId)
    : null;

  const cityPrefix = topCity ? `${topCity.city} says ` : "Live Consensus: ";
  const myCallSnippet = myOutcome ? `My call: ${myOutcome.label}! ` : "";
  const shareLine = `${myCallSnippet}${cityPrefix}${first?.pct.toFixed(1)}% ${first?.label ?? ""} vs ${second?.pct.toFixed(1) ?? "0"}% ${second?.label ?? ""} — "${market.question}" What's your call on Oracle Black?`;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://oracle-black.arena";
  const shareUrl =
    typeof window !== "undefined"
      ? `${origin}/?poll=${encodeURIComponent(market.id)}`
      : "https://oracle-black.arena";
  const embedHtml = `<iframe src="${origin}/embed/${market.id}" width="100%" height="260" style="border:1px solid #cce6e1;border-radius:12px;" title="${market.question}"></iframe>`;

  useEffect(() => {
    const url = renderPredictionCardDataUrl({ market, user, topCity, lang });
    setCardPngUrl(url);
  }, [market, user, topCity, lang]);

  function copyText() {
    navigator.clipboard?.writeText(`${shareLine}\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyEmbed() {
    navigator.clipboard?.writeText(embedHtml);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg border border-primary/40 bg-surface p-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-primary uppercase">
            <Share2 className="size-4" />
            Battleground Share Card
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted hover:bg-bg hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Rendered 1200x630 WhatsApp / Social PNG Preview */}
        {cardPngUrl ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-primary/30 shadow-sm">
            <img
              src={cardPngUrl}
              alt="Oracle Black Prediction Card Preview"
              className="aspect-[1200/630] w-full object-cover"
            />
          </div>
        ) : (
          <div className="mt-3 rounded border border-primary/30 bg-gradient-to-br from-[#f2faf9] to-[#dff3f0] p-4 shadow-inner">
            <h4 className="text-base font-bold leading-snug text-fg">{market.question}</h4>
          </div>
        )}

        {/* Personalized Call & Accuracy Summary */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded border border-line bg-bg/80 px-3 py-2 font-mono text-[11px]">
          <span className="text-fg">
            {myOutcome ? (
              <>
                My Locked Call: <strong style={{ color: myOutcome.color }}>{myOutcome.label}</strong>
              </>
            ) : (
              "Vote 1-tap to personalize card with your prediction!"
            )}
          </span>
          <span className="font-bold text-primary">
            Acc {(user?.accuracyPct ?? 72.5).toFixed(1)}% · 🔥 {user?.streakDays ?? 1}d Streak
          </span>
        </div>

        {/* Share & Download Buttons */}
        <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-4">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${shareLine} ${shareUrl}`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 rounded border border-primary/50 bg-primary py-2 font-bold text-white hover:brightness-110"
          >
            WhatsApp
          </a>
          <button
            type="button"
            onClick={() => downloadCardPng(cardPngUrl, `oracle-black-${market.id}.png`)}
            className="flex items-center justify-center gap-1.5 rounded border border-accent/50 bg-accent/15 py-2 font-bold text-accent hover:bg-accent/25"
          >
            <Download className="size-3.5" />
            PNG Card
          </button>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareLine)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 rounded border border-cyan/50 bg-cyan/15 py-2 font-bold text-cyan hover:bg-cyan/25"
          >
            Post on X
          </a>
          <button
            type="button"
            onClick={copyText}
            className="flex items-center justify-center gap-1.5 rounded border border-line bg-bg py-2 text-fg hover:border-primary"
          >
            {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Journalist Embed Widget Code */}
        <div className="mt-3 rounded border border-line bg-bg/70 p-2.5 font-mono text-[10px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 font-bold text-fg uppercase">
              <Code2 className="size-3.5 text-primary" />
              Journalist Embed Widget (&lt;iframe&gt;)
            </span>
            <button
              type="button"
              onClick={copyEmbed}
              className="rounded border border-line bg-surface px-2 py-0.5 font-bold text-primary hover:border-primary"
            >
              {copiedEmbed ? "Copied Code" : "Copy Embed"}
            </button>
          </div>
          <code className="mt-1.5 block truncate rounded bg-surface px-2 py-1 text-[10px] text-muted">
            {embedHtml}
          </code>
        </div>
      </div>
    </div>
  );
}
