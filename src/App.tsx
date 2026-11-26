import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  CheckCircle2,
  Compass,
  EyeOff,
  Flame,
  Globe,
  Lock,
  MessageSquare,
  Moon,
  Newspaper,
  Scale,
  Share2,
  ShieldCheck,
  Sun,
  Terminal,
  TrendingUp,
} from "lucide-react";
import { ConsensusChart } from "@/components/ConsensusChart";
import { LiveArenaClash } from "@/components/LiveArenaClash";
import { GeoPanel } from "@/components/GeoPanel";
import { DebatePanel } from "@/components/DebatePanel";
import { NewsWirePanel } from "@/components/NewsWirePanel";
import { TerminalProPanel } from "@/components/TerminalProPanel";
import { CommunityWallPanel } from "@/components/CommunityWallPanel";
import { BattlegroundModal } from "@/components/BattlegroundModal";
import { VerifyModal } from "@/components/VerifyModal";
import { TrustMethodologyModal } from "@/components/TrustMethodologyModal";
import { JournalistEmbedView } from "@/components/JournalistEmbedView";
import { VoiceMicButton } from "@/components/VoiceMicButton";
import { t } from "@/lib/i18n";
import { getOrInitToken, solveBallotPow } from "@/lib/pow";
import type {
  CategoryId,
  Language,
  LeaderboardEntry,
  MarketDetailResponse,
  MarketSummary,
  UiMode,
  UserProfile,
} from "@/lib/types";

type ActiveTab = "consensus" | "geo" | "debate" | "wall" | "news" | "terminal";

const CATEGORIES: Array<{ id: "all" | CategoryId; label: string; labelHi: string }> = [
  { id: "all", label: "All Battles", labelHi: "सभी" },
  { id: "elections", label: "Elections", labelHi: "चुनाव" },
  { id: "cricket", label: "Cricket", labelHi: "क्रिकेट" },
  { id: "economy", label: "Economy & RBI", labelHi: "अर्थव्यवस्था" },
  { id: "shares", label: "Markets", labelHi: "शेयर बाज़ार" },
  { id: "sponsored", label: "Ask India", labelHi: "स्पॉन्सर्ड" },
];

export function App() {
  const embedMatch =
    typeof window !== "undefined" ? window.location.pathname.match(/^\/embed\/([a-zA-Z0-9_-]+)/) : null;
  if (embedMatch?.[1]) {
    return <JournalistEmbedView marketId={embedMatch[1]} />;
  }

  const [token] = useState(() => getOrInitToken());
  const [markets, setMarkets] = useState<MarketSummary[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("poll") || "up-election-2027";
    }
    return "up-election-2027";
  });
  const [detail, setDetail] = useState<MarketDetailResponse | null>(null);

  const [mode, setMode] = useState<UiMode>("arena");
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined" && localStorage.getItem("oracle_black_lang") === "hi") {
      return "hi";
    }
    return "en";
  });
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);
  const [tab, setTab] = useState<ActiveTab>(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("group")) {
      return "wall";
    }
    return "consensus";
  });
  const [category, setCategory] = useState<"all" | CategoryId>("all");
  const [search, setSearch] = useState("");
  const [pulseMode, setPulseMode] = useState(false);

  const [castingOutcomeId, setCastingOutcomeId] = useState<string | null>(null);
  const [castMessage, setCastMessage] = useState<string | null>(null);
  const [recentSurgeId, setRecentSurgeId] = useState<string | null>(null);
  const [surging, setSurging] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [sseLogs, setSseLogs] = useState<string[]>([]);
  const [wallTick, setWallTick] = useState(0);
  const [groupTick, setGroupTick] = useState(0);
  const [utcClock, setUtcClock] = useState(() => new Date().toISOString().slice(11, 19));

  const copy = t(lang);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("oracle_black_lang", lang);
  }, [lang]);

  const loadBoard = useCallback(async () => {
    const res = await fetch(`/api/board?token=${encodeURIComponent(token)}`);
    if (!res.ok) return;
    const data = await res.json();
    setMarkets(data.markets ?? []);
    if (data.user) setUser(data.user);
    setLeaderboard(data.leaderboard ?? []);
  }, [token]);

  const loadDetail = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/markets/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`);
      if (!res.ok) return;
      const data = (await res.json()) as MarketDetailResponse;
      setDetail(data);
    },
    [token],
  );

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  // Live UTC Clock
  useEffect(() => {
    const id = window.setInterval(() => {
      setUtcClock(new Date().toISOString().slice(11, 19));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Real-time Server-Sent Events (SSE) subscription
  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.addEventListener("tick", (evt) => {
      const msg = (evt as MessageEvent).data;
      const parsed = JSON.parse(msg);
      if (parsed.marketId === selectedId && parsed.outcomeId) {
        setRecentSurgeId(parsed.outcomeId);
        window.setTimeout(() => setRecentSurgeId(null), 1200);
        if (alertsEnabled) {
          const alertText = `Live shift in ${parsed.city || "India"}: +1 ballot on ${String(parsed.outcomeId).toUpperCase()}`;
          setLiveAlert(alertText);
          window.setTimeout(() => setLiveAlert(null), 3500);
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Oracle Black Live Pulse", { body: alertText });
          }
        }
      }
      setSseLogs((prev) => [`[TICK] ${msg}`, ...prev].slice(0, 30));
      void loadBoard();
      void loadDetail(selectedId);
    });
    es.addEventListener("reaction", (evt) => {
      const parsed = JSON.parse((evt as MessageEvent).data);
      setSseLogs((prev) => [`[PULSE] ${(evt as MessageEvent).data}`, ...prev].slice(0, 30));
      if (parsed.marketId === selectedId) {
        setDetail((prev) => (prev ? { ...prev, recentReactions: parsed.reactions } : prev));
      }
    });
    es.addEventListener("market_created", () => {
      void loadBoard();
    });
    es.addEventListener("debate", () => {
      void loadDetail(selectedId);
    });
    es.addEventListener("wall_post", () => {
      setWallTick((t) => t + 1);
    });
    es.addEventListener("group_created", () => {
      setGroupTick((t) => t + 1);
    });
    es.addEventListener("group_msg", () => {
      setGroupTick((t) => t + 1);
    });
    return () => es.close();
  }, [selectedId, loadBoard, loadDetail, alertsEnabled]);

  function toggleAlerts() {
    const next = !alertsEnabled;
    setAlertsEnabled(next);
    if (next && typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission().catch(() => {});
    }
    if (next) {
      setLiveAlert("Live Poll Alerts enabled — you will see real-time surge shifts here.");
      window.setTimeout(() => setLiveAlert(null), 3200);
    }
  }

  const filteredMarkets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return markets.filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (!q) return true;
      return (
        m.question.toLowerCase().includes(q) ||
        m.outcomes.some((o) => o.label.toLowerCase().includes(q))
      );
    });
  }, [markets, category, search]);

  const activeMarket = detail?.market ?? markets.find((m) => m.id === selectedId) ?? markets[0];

  async function handleOneTapVote(outcomeId: string) {
    if (!activeMarket || castingOutcomeId || activeMarket.myOutcomeId) return;
    setCastingOutcomeId(outcomeId);
    setCastMessage(null);
    try {
      const pow = await solveBallotPow(activeMarket.id, outcomeId, token);
      const res = await fetch("/api/cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: activeMarket.id,
          outcomeId,
          token,
          city: user?.city ?? "Lucknow",
          nonce: pow.nonce,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setCastMessage(data.reason || "Could not lock call.");
        return;
      }
      if (data.detail) setDetail(data.detail);
      if (data.user) setUser(data.user);
      setRecentSurgeId(outcomeId);
      window.setTimeout(() => setRecentSurgeId(null), 1300);
      await loadBoard();
      setCastMessage(
        `Locked with PoW #${pow.hashPrefix} (${data.weightApplied}x human weight). Zero money risked.`,
      );
    } catch {
      setCastMessage("Network error while locking your call.");
    } finally {
      setCastingOutcomeId(null);
    }
  }

  async function handleSimulateSurge() {
    if (!activeMarket || surging) return;
    setSurging(true);
    try {
      await fetch("/api/crowd-surge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId: activeMarket.id }),
      });
    } finally {
      window.setTimeout(() => setSurging(false), 1800);
    }
  }

  async function handleReact(emoji: string) {
    if (!activeMarket) return;
    await fetch("/api/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId: activeMarket.id, emoji }),
    });
  }

  const questionText = activeMarket
    ? lang === "hi" && activeMarket.questionHi
      ? activeMarket.questionHi
      : activeMarket.question
    : "";

  const blurbText = activeMarket
    ? lang === "hi" && activeMarket.blurbHi
      ? activeMarket.blurbHi
      : activeMarket.blurb
    : "";

  return (
    <div className="min-h-dvh overflow-x-hidden bg-bg text-fg">
      {/* Top Oracle Black Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded border border-primary/50 bg-primary/10 glow-primary">
              <span className="relative flex size-2.5">
                <span className="live-ping absolute inline-flex size-2.5 rounded-full bg-primary" />
                <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-extrabold tracking-tight text-fg">
                  ORACLE <span className="text-primary">//</span> BLACK
                </span>
                <span className="hidden rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary sm:inline">
                  {copy.zeroMoneyArena}
                </span>
                <button
                  type="button"
                  onClick={() => setShowTrustModal(true)}
                  className="hidden items-center gap-1 rounded border border-cyan/40 bg-cyan/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan hover:bg-cyan/20 md:inline-flex"
                  title="View Open Methodology & Zero Party Funding Proof"
                >
                  <Scale className="size-2.5" />
                  {copy.verifiedIndependent}
                </button>
              </div>
              <p className="hidden font-mono text-[10px] text-muted md:block">
                {copy.brandSubtitle}
              </p>
            </div>
          </div>

          {/* Controls: Mode Switcher, Alerts, Theme, Language Toggle, Trust Tier, Streak & REP */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs sm:gap-2">
            {/* Arena vs Pro Terminal Mode Toggle */}
            <div className="flex rounded border border-line bg-bg p-0.5">
              <button
                type="button"
                onClick={() => {
                  setMode("arena");
                  if (tab === "terminal") setTab("consensus");
                }}
                className={`rounded-xs px-2.5 py-1 text-[11px] transition-colors ${
                  mode === "arena" ? "bg-primary text-bg font-bold" : "text-muted hover:text-fg"
                }`}
              >
                {copy.arenaMode}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("terminal");
                  setTab("terminal");
                }}
                className={`flex items-center gap-1 rounded-xs px-2.5 py-1 text-[11px] transition-colors ${
                  mode === "terminal" ? "bg-accent text-bg font-bold" : "text-muted hover:text-fg"
                }`}
              >
                <Terminal className="size-3" />
                {copy.proTerminal}
              </button>
            </div>

            {/* Live Poll Alerts Toggle */}
            <button
              type="button"
              onClick={toggleAlerts}
              className={`hidden items-center gap-1 rounded border px-2 py-1 text-[11px] transition-colors sm:flex ${
                alertsEnabled
                  ? "border-primary bg-primary/15 text-primary font-bold"
                  : "border-line bg-bg text-muted hover:text-fg"
              }`}
              title="Enable live poll swing & surge alerts"
            >
              {alertsEnabled ? <BellRing className="size-3" /> : <Bell className="size-3" />}
              <span className="hidden xl:inline">{alertsEnabled ? copy.alertsOn : copy.alertsOff}</span>
            </button>

            {/* Dark / Heavenly Teal Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme((cur) => (cur === "light" ? "dark" : "light"))}
              className="flex items-center gap-1 rounded border border-line bg-bg px-2 py-1 text-[11px] text-fg hover:border-primary"
              title={theme === "light" ? "Switch to Dark Analytics Mode" : "Switch to Heavenly Light Teal"}
            >
              {theme === "light" ? <Moon className="size-3 text-primary" /> : <Sun className="size-3 text-gold" />}
            </button>

            {/* EN / हिन्दी Vernacular Toggle */}
            <button
              type="button"
              onClick={() => setLang((l) => (l === "en" ? "hi" : "en"))}
              className="flex items-center gap-1 rounded border border-line bg-bg px-2.5 py-1 text-[11px] text-fg hover:border-primary"
              title="Switch English / Hindi"
            >
              <Globe className="size-3 text-cyan" />
              {lang === "en" ? "EN / हिं" : "हिन्दी"}
            </button>

            {/* Progressive Trust Tier Button */}
            <button
              type="button"
              onClick={() => setShowVerifyModal(true)}
              className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                user?.tier === "verified"
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-accent/60 bg-accent/15 text-accent hover:bg-accent/25"
              }`}
            >
              <ShieldCheck className="size-3.5" />
              {user?.tier === "verified" ? copy.verified1x : copy.guestVerify}
            </button>

            {/* Streak + REP & Clock */}
            <div className="hidden border-l border-line pl-2.5 text-right sm:block">
              <p className="font-bold text-primary tabular-nums">
                <span className="mr-1.5 text-accent">🔥{user?.streakDays ?? 1}d</span>
                {user?.rep ?? 1000} REP
              </p>
              <p className="text-[10px] text-muted tabular-nums">{utcClock} UTC</p>
            </div>
          </div>
        </div>

        {/* Live Ticker Strip */}
        <div className="border-t border-line/70 bg-surface-elevated/90 px-3 py-1 font-mono text-[11px] text-muted">
          <div className="mx-auto flex max-w-[1440px] items-center gap-4 overflow-x-auto whitespace-nowrap scrollbar-none">
            <span className="flex shrink-0 items-center gap-1.5 font-bold text-primary">
              <Flame className="size-3 text-accent" />
              {copy.livePulse}
            </span>
            {markets.slice(0, 4).map((m) => {
              const top = [...m.outcomes].sort((a, b) => b.pct - a.pct)[0];
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className="flex shrink-0 items-center gap-1.5 hover:text-fg"
                >
                  <span className="text-fg/90">{m.question.slice(0, 34)}...</span>
                  <span className="font-bold text-primary">
                    {top?.label.split(" ")[0]} {top?.pct.toFixed(1)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="mx-auto max-w-[1440px] px-3 py-4 sm:px-4">
        {/* Mobile-First Quick Battle Switcher (keeps Hero Battle in top fold!) */}
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 lg:hidden scrollbar-none">
          {markets.map((m) => {
            const top = [...m.outcomes].sort((a, b) => b.pct - a.pct)[0];
            const active = activeMarket?.id === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={`shrink-0 rounded border px-3 py-1.5 text-left font-mono text-[11px] ${
                  active
                    ? "border-primary bg-primary/15 text-fg font-bold"
                    : "border-line bg-surface text-muted"
                }`}
              >
                <span className="block max-w-[170px] truncate">{m.question}</span>
                <span className="text-[10px] text-primary">
                  {top?.label.split(" ")[0]} {top?.pct.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Desktop Left Sidebar: Market Explorer */}
          <aside className="hidden min-w-0 space-y-3 lg:col-span-4 lg:block">
            <div className="rounded border border-line bg-surface p-3">
              <div className="flex items-center justify-between font-mono text-[11px] text-muted">
                <span>{copy.activeBattles}</span>
                <span className="flex items-center gap-1.5 text-primary">
                  <span className="size-2 rounded-full bg-crimson animate-pulse" />
                  {markets.length} {copy.liveCountSuffix}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className="min-w-0 flex-1 rounded border border-line bg-bg px-3 py-2 font-mono text-xs text-fg outline-none focus:border-primary"
                />
                <VoiceMicButton
                  lang={lang}
                  label=""
                  onTranscript={(txt) => setSearch(txt)}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`rounded border px-2 py-1 font-mono text-[10px] ${
                      category === c.id
                        ? "border-primary bg-primary text-bg font-bold"
                        : "border-line bg-bg text-muted hover:text-fg"
                    }`}
                  >
                    {lang === "hi" ? c.labelHi : c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {filteredMarkets.map((m) => {
                const top = [...m.outcomes].sort((a, b) => b.pct - a.pct)[0];
                const isSelected = activeMarket?.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    className={`w-full rounded border p-3 text-left transition-all ${
                      isSelected
                        ? "card-heartbeat border-primary bg-surface-elevated glow-primary"
                        : "border-line bg-surface hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {m.imageUrl && (
                        <img
                          src={m.imageUrl}
                          alt={m.question}
                          loading="lazy"
                          className="size-12 shrink-0 rounded border border-line object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span className="uppercase text-muted">{m.category}</span>
                          {m.isHotBattle ? (
                            <span className="rounded bg-accent/20 px-1.5 py-0.5 font-bold text-accent">
                              HOT BATTLE
                            </span>
                          ) : m.sponsored ? (
                            <span className="rounded bg-cyan/20 px-1.5 py-0.5 font-bold text-cyan">
                              SPONSORED
                            </span>
                          ) : (
                            <span className="text-primary">{m.verifiedPct}% Human</span>
                          )}
                        </div>
                        <h4 className="mt-1 text-xs font-semibold leading-snug text-fg">
                          {lang === "hi" && m.questionHi ? m.questionHi : m.question}
                        </h4>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between font-mono text-xs">
                      <span className="text-primary font-bold">
                        {top ? `${top.label} · ${top.pct.toFixed(1)}%` : "Open"}
                      </span>
                      <span className="text-[10px] text-muted">{m.totalRawVotes} calls</span>
                    </div>
                    <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-bg">
                      {m.outcomes.map((o) => (
                        <div
                          key={o.id}
                          style={{ width: `${o.pct}%`, backgroundColor: o.color }}
                          className="h-full"
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Main Stage (Hero Card + 1-Tap Vote + Wired Screen Tabs) */}
          <section className="min-w-0 space-y-4 lg:col-span-8">
            {activeMarket && (
              <>
                {liveAlert && (
                  <div className="flex items-center justify-between rounded border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-xs text-primary">
                    <span className="flex items-center gap-2 font-bold">
                      <BellRing className="size-3.5 shrink-0" />
                      {liveAlert}
                    </span>
                  </div>
                )}

                {activeMarket.blackoutActive && (
                  <div className="rounded border border-crimson/50 bg-crimson/10 px-3.5 py-2.5 font-mono text-xs text-crimson">
                    <p className="flex items-center gap-1.5 font-bold uppercase">
                      <Scale className="size-4 shrink-0" />
                      {copy.blackoutBannerTitle}
                    </p>
                    <p className="mt-1 text-[11px] text-fg/90">{copy.blackoutBannerDesc}</p>
                  </div>
                )}

                {/* Anti-IT-Cell Proof Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-primary/30 bg-surface px-3.5 py-2.5 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    <span className="font-bold text-primary">{copy.antiItCellActive}</span>
                    <span className="hidden text-muted sm:inline">{copy.antiItCellSub}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-primary">
                      <strong>{activeMarket.verifiedPct}%</strong> {copy.otpVerified}
                    </span>
                    <span className="text-accent">
                      <strong>{activeMarket.sybilsBlocked}</strong> {copy.botsBlocked}
                    </span>
                  </div>
                </div>

                {/* Hero Question with AI Battleground Imagery & 1-Tap 5-Second Vote Panel */}
                <div className="overflow-hidden rounded-lg border border-line bg-surface">
                  {/* Visual AI Battleground Banner */}
                  {activeMarket.imageUrl && (
                    <div className="relative flex min-h-60 w-full flex-col justify-between overflow-hidden border-b border-line bg-gradient-to-r from-[#fff1e6] via-[#e8f6f3] to-[#ffeef2] p-3 sm:min-h-72 sm:p-4">
                      <img
                        src={activeMarket.imageUrl}
                        alt={questionText}
                        className={`absolute inset-0 h-full w-full ${
                          activeMarket.id === "up-election-2027"
                            ? "object-contain object-top"
                            : "object-cover object-center"
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/65 to-bg/10" />

                      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 rounded-full border border-crimson/40 bg-surface/92 px-2 py-0.5 font-bold text-crimson shadow-xs backdrop-blur-sm">
                            <span className="size-2 rounded-full bg-crimson animate-pulse" />
                            LIVE
                          </span>
                          <span className="rounded-full border border-line bg-surface/90 px-2.5 py-0.5 font-bold uppercase text-fg backdrop-blur-sm">
                            {activeMarket.league}
                          </span>
                          {activeMarket.sponsor && (
                            <span className="rounded-full bg-accent px-2.5 py-0.5 font-bold text-white shadow-sm">
                              Sponsored · {activeMarket.sponsor}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowShareModal(true)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-bold shadow-sm backdrop-blur-sm transition-all ${
                            activeMarket.myOutcomeId
                              ? "glow-primary animate-pulse border-primary bg-primary text-white"
                              : "border-line bg-surface/90 text-fg hover:border-primary"
                          }`}
                        >
                          <Share2
                            className={`size-3.5 ${
                              activeMarket.myOutcomeId ? "text-white" : "text-primary"
                            }`}
                          />
                          {activeMarket.myOutcomeId ? `${copy.shareCard} ⚡` : copy.shareCard}
                        </button>
                      </div>

                      <div className="relative z-10 mt-6 space-y-2">
                        {activeMarket.id === "up-election-2027" && (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 rounded-lg border border-[#f97316]/50 bg-surface/92 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
                              <span className="flex size-7 items-center justify-center rounded-full bg-[#f97316] font-mono text-[11px] font-extrabold text-white">
                                YA
                              </span>
                              <div className="font-mono leading-tight">
                                <p className="text-[11px] font-bold text-fg">
                                  {lang === "hi" ? "योगी आदित्यनाथ" : "CM Yogi Adityanath"}
                                </p>
                                <p className="text-[10px] font-bold text-[#f97316]">
                                  BJP ·{" "}
                                  {activeMarket.outcomes.find((o) => o.id === "bjp")?.pct.toFixed(1)}%
                                </p>
                              </div>
                            </div>

                            <span className="rounded-full bg-fg px-2.5 py-1 font-mono text-[10px] font-extrabold text-white shadow">
                              ⚡ VS
                            </span>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <div className="flex items-center gap-2 rounded-lg border border-[#e11d48]/50 bg-surface/92 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
                                <span className="flex size-7 items-center justify-center rounded-full bg-[#e11d48] font-mono text-[11px] font-extrabold text-white">
                                  AY
                                </span>
                                <div className="font-mono leading-tight">
                                  <p className="text-[11px] font-bold text-fg">
                                    {lang === "hi" ? "अखिलेश यादव" : "Akhilesh Yadav"}
                                  </p>
                                  <p className="text-[10px] font-bold text-[#e11d48]">
                                    SP ·{" "}
                                    {activeMarket.outcomes.find((o) => o.id === "sp")?.pct.toFixed(1)}%
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 rounded-lg border border-[#0d9488]/50 bg-surface/92 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
                                <span className="flex size-7 items-center justify-center rounded-full bg-[#0d9488] font-mono text-[11px] font-extrabold text-white">
                                  RG
                                </span>
                                <div className="font-mono leading-tight">
                                  <p className="text-[11px] font-bold text-fg">
                                    {lang === "hi" ? "राहुल गांधी" : "Rahul Gandhi"}
                                  </p>
                                  <p className="text-[10px] font-bold text-[#0d9488]">
                                    INC ·{" "}
                                    {activeMarket.outcomes.find((o) => o.id === "inc")?.pct.toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <h1 className="text-lg font-extrabold leading-snug text-fg drop-shadow-xs sm:text-xl">
                            {questionText}
                          </h1>
                          <p className="mt-0.5 line-clamp-1 text-xs font-medium text-fg/80">
                            {blurbText}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4">
                  {/* 1-Tap Vote Grid (Under 5 Seconds) */}
                  <div>
                    <div className="mb-2 flex items-center justify-between font-mono text-[11px]">
                      <span className="font-bold text-fg uppercase">
                        {activeMarket.myOutcomeId ? copy.yourCallLocked : copy.oneTapCall}
                      </span>
                      <span className="text-muted">
                        {copy.stakeLabel}: {activeMarket.stake} REP
                      </span>
                    </div>

                    <LiveArenaClash
                      outcomes={activeMarket.outcomes}
                      points={detail?.chart ?? []}
                      myOutcomeId={activeMarket.myOutcomeId}
                      castingOutcomeId={castingOutcomeId}
                      recentSurgeId={recentSurgeId}
                      lang={lang}
                      onVote={(id) => void handleOneTapVote(id)}
                      onSimulateSurge={() => void handleSimulateSurge()}
                      surging={surging}
                    />

                    {castMessage && (
                      <p className="mt-2.5 flex items-center gap-1.5 rounded border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-xs text-primary">
                        {activeMarket.myOutcomeId ? (
                          <CheckCircle2 className="size-4 shrink-0" />
                        ) : (
                          <Lock className="size-4 shrink-0" />
                        )}
                        {castMessage}
                      </p>
                    )}
                  </div>
                  </div>
                </div>

                {/* Screen Navigation Tabs */}
                <div className="flex gap-1.5 overflow-x-auto rounded border border-line bg-surface p-1 font-mono text-xs scrollbar-none">
                  {(
                    [
                      ["consensus", copy.tabConsensus, TrendingUp],
                      ["wall", copy.tabWall, EyeOff],
                      ["geo", copy.tabGeo, Compass],
                      ["debate", copy.tabDebate, MessageSquare],
                      ["news", copy.tabNews, Newspaper],
                    ] as const
                  ).map(([id, text, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-xs px-3 py-1.5 transition-colors ${
                        tab === id ? "bg-primary text-bg font-bold" : "text-muted hover:text-fg"
                      }`}
                    >
                      <Icon className="size-3.5" />
                      {text}
                    </button>
                  ))}

                  {mode === "terminal" && (
                    <button
                      type="button"
                      onClick={() => setTab("terminal")}
                      className={`flex shrink-0 items-center gap-1.5 rounded-xs px-3 py-1.5 transition-colors ${
                        tab === "terminal"
                          ? "bg-accent text-bg font-bold"
                          : "text-accent hover:bg-accent/10"
                      }`}
                    >
                      <Terminal className="size-3.5" />
                      {copy.tabTerminal}
                    </button>
                  )}
                </div>

                {/* Wired Screen Content */}
                {tab === "consensus" && detail && (
                  <ConsensusChart
                    outcomes={activeMarket.outcomes}
                    points={detail.chart}
                    velocityPerMin={detail.velocityPerMin}
                    volume24h={detail.volume24h}
                    totalRawVotes={activeMarket.totalRawVotes}
                    verifiedPct={activeMarket.verifiedPct}
                    sybilsBlocked={activeMarket.sybilsBlocked}
                    reactions={detail.recentReactions}
                    onReact={(emoji) => void handleReact(emoji)}
                    mode={mode}
                    lang={lang}
                    pulseMode={pulseMode}
                    onTogglePulse={() => setPulseMode((v) => !v)}
                  />
                )}

                {tab === "geo" && detail && (
                  <GeoPanel
                    cities={detail.cities}
                    outcomes={activeMarket.outcomes}
                    marketId={activeMarket.id}
                    token={token}
                    lang={lang}
                  />
                )}

                {tab === "wall" && (
                  <CommunityWallPanel
                    token={token}
                    activeMarket={activeMarket}
                    markets={markets}
                    wallTick={wallTick}
                    groupTick={groupTick}
                    lang={lang}
                  />
                )}

                {tab === "debate" && detail && (
                  <DebatePanel
                    marketId={activeMarket.id}
                    outcomes={activeMarket.outcomes}
                    debates={detail.debates}
                    leaderboard={leaderboard}
                    token={token}
                    user={user}
                    onPosted={() => void loadDetail(activeMarket.id)}
                  />
                )}

                {tab === "news" && <NewsWirePanel marketId={activeMarket.id} lang={lang} />}

                {tab === "terminal" && mode === "terminal" && (
                  <TerminalProPanel
                    market={activeMarket}
                    sseLogs={sseLogs}
                    onCampaignCreated={(newId) => {
                      void loadBoard();
                      setSelectedId(newId);
                      setTab("consensus");
                    }}
                    onBlackoutToggled={() => {
                      void loadBoard();
                      void loadDetail(activeMarket.id);
                    }}
                  />
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* Modals */}
      {showShareModal && activeMarket && (
        <BattlegroundModal
          market={activeMarket}
          user={user}
          topCity={detail?.cities[0]}
          lang={lang}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showVerifyModal && user && (
        <VerifyModal
          user={user}
          onClose={() => setShowVerifyModal(false)}
          onVerified={(updated) => {
            setUser(updated);
            void loadBoard();
            if (activeMarket) void loadDetail(activeMarket.id);
          }}
        />
      )}

      {showTrustModal && <TrustMethodologyModal onClose={() => setShowTrustModal(false)} />}
    </div>
  );
}

export default App;
