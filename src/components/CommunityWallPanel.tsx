import { useCallback, useEffect, useState } from "react";
import {
  Award,
  BarChart2,
  Check,
  Clock,
  EyeOff,
  Flag,
  Flame,
  Link2,
  Lock,
  MessageCircle,
  Pin,
  Plus,
  Send,
  ShieldCheck,
  ThumbsUp,
  Trophy,
  Users,
} from "lucide-react";
import { VoiceMicButton } from "@/components/VoiceMicButton";
import { t } from "@/lib/i18n";
import { solveWallPow } from "@/lib/pow";
import type {
  CommunityGroup,
  GroupLeaderboardMember,
  GroupMessage,
  Language,
  MarketSummary,
  SentimentTone,
  WallPost,
} from "@/lib/types";

const TONES: Array<{ id: SentimentTone; label: string; badge: string }> = [
  { id: "open", label: "Open Thought", badge: "💭 Thought" },
  { id: "shift", label: "Ground Shift", badge: "🔥 Shift" },
  { id: "insight", label: "Data Point", badge: "📊 Insight" },
  { id: "contrarian", label: "Contrarian", badge: "⚡ Contrarian" },
];

function relativeTime(ts: number): string {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function burnCountdown(expiresAt?: number | null): string {
  if (!expiresAt) return "24h Burn";
  const diff = Math.max(0, expiresAt - Date.now());
  const hrs = Math.floor(diff / 3600_000);
  const mins = Math.floor((diff % 3600_000) / 60_000);
  return `Burns in ${hrs}h ${mins}m`;
}

export function CommunityWallPanel({
  token,
  activeMarket,
  markets,
  wallTick,
  groupTick,
  lang = "en",
}: {
  token: string;
  activeMarket?: MarketSummary;
  markets: MarketSummary[];
  wallTick: number;
  groupTick: number;
  lang?: Language;
}) {
  const copy = t(lang);
  // Public Wall State
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [wallBody, setWallBody] = useState("");
  const [tone, setTone] = useState<SentimentTone>("open");
  const [tagActivePoll, setTagActivePoll] = useState(true);
  const [attachStance, setAttachStance] = useState(true);
  const [scopeFilter, setScopeFilter] = useState<"all" | "poll">("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"latest" | "calibrated">("latest");
  const [postingWall, setPostingWall] = useState(false);
  const [wallStatus, setWallStatus] = useState<string | null>(null);

  // Groups & Group Chat State
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>("grp-up-ground");
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [groupView, setGroupView] = useState<"chat" | "rank">("chat");
  const [groupMembers, setGroupMembers] = useState<GroupLeaderboardMember[]>([]);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [chatText, setChatText] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  // Group Pinned Consensus Publisher
  const [showPulsePublisher, setShowPulsePublisher] = useState(false);
  const [pulseSummary, setPulseSummary] = useState("");

  // Create Group Form State
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupTopic, setNewGroupTopic] = useState("Elections");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupPrivate, setNewGroupPrivate] = useState(false);
  const [newGroupBurn, setNewGroupBurn] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [groupNotice, setGroupNotice] = useState<string | null>(null);

  const loadWall = useCallback(async () => {
    const params = new URLSearchParams();
    if (scopeFilter === "poll" && activeMarket) params.set("marketId", activeMarket.id);
    if (verifiedOnly) params.set("verifiedOnly", "1");
    params.set("sort", sortBy);
    const res = await fetch(`/api/wall?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts ?? []);
    }
  }, [scopeFilter, activeMarket, verifiedOnly, sortBy]);

  const loadGroups = useCallback(async () => {
    const res = await fetch(`/api/groups?token=${encodeURIComponent(token)}`);
    if (res.ok) {
      const data = await res.json();
      setGroups(data.groups ?? []);
    }
  }, [token]);

  const loadMessages = useCallback(async (gId: string) => {
    if (!gId) return;
    const res = await fetch(`/api/groups/${encodeURIComponent(gId)}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages ?? []);
    }
  }, []);

  const loadGroupLeaderboard = useCallback(
    async (gId: string) => {
      if (!gId) return;
      const res = await fetch(
        `/api/groups/${encodeURIComponent(gId)}/leaderboard?token=${encodeURIComponent(token)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setGroupMembers(data.members ?? []);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadWall();
  }, [loadWall, wallTick]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups, groupTick]);

  useEffect(() => {
    if (activeGroupId) {
      void loadMessages(activeGroupId);
      void loadGroupLeaderboard(activeGroupId);
    }
  }, [activeGroupId, loadMessages, loadGroupLeaderboard, groupTick]);

  // Auto-open & join group if user arrived via ?group=<id>&code=<code> invite link
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const invGroup = params.get("group");
    const invCode = params.get("code") ?? "";
    if (!invGroup) return;
    setActiveGroupId(invGroup);
    fetch(`/api/groups/${encodeURIComponent(invGroup)}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, inviteCode: invCode }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok) {
          setGroups(data.groups ?? []);
          setGroupNotice(`Joined invited group as ${data.roomMask}.`);
        }
      })
      .catch(() => {});
  }, [token]);

  function copyGroupInviteLink(g: CommunityGroup) {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({ group: g.id });
    if (g.inviteCode) params.set("code", g.inviteCode);
    const url = `${base}/?${params.toString()}`;
    navigator.clipboard?.writeText(url);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  }

  async function submitWallPost(e: React.FormEvent) {
    e.preventDefault();
    if (!wallBody.trim() || postingWall) return;
    setPostingWall(true);
    setWallStatus(null);
    try {
      const pow = await solveWallPow(token);
      const res = await fetch("/api/wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          marketId: tagActivePoll && activeMarket ? activeMarket.id : null,
          attachMyCall: attachStance,
          tone,
          body: wallBody,
          nonce: pow.nonce,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setWallStatus(data.reason || "Post blocked by Anti-Spam shield.");
        return;
      }
      setWallBody("");
      setWallStatus("Posted anonymously (zero identity stored).");
      await loadWall();
    } finally {
      setPostingWall(false);
    }
  }

  async function reactToPost(postId: number, kind: "agree" | "sharp" | "flag") {
    await fetch(`/api/wall/${postId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    await loadWall();
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupDesc.trim()) return;
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        name: newGroupName,
        topic: newGroupTopic,
        description: newGroupDesc,
        isPrivate: newGroupPrivate,
        isBurnRoom: newGroupBurn,
        marketId: activeMarket?.id ?? null,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setGroups(data.groups ?? []);
      setActiveGroupId(data.groupId);
      setShowCreateGroup(false);
      setNewGroupName("");
      setNewGroupDesc("");
      setNewGroupBurn(false);
      setGroupNotice(
        data.inviteCode
          ? `Private room created! Invite Code: ${data.inviteCode} (Your mask: ${data.roomMask})`
          : `Group live! You are masked as ${data.roomMask}.`,
      );
    }
  }

  async function joinGroup(groupId: string) {
    setGroupNotice(null);
    const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, inviteCode: inviteInput }),
    });
    const data = await res.json();
    if (!data.ok) {
      setGroupNotice(data.reason || "Could not join group.");
      return;
    }
    setGroups(data.groups ?? []);
    setInviteInput("");
    setGroupNotice(`Joined safely as ${data.roomMask} (rotated per room).`);
  }

  async function sendGroupMessage(e: React.FormEvent, sharePoll = false) {
    e.preventDefault();
    if (!activeGroupId) return;
    const payloadText =
      sharePoll && activeMarket
        ? `[Live Poll Pulse] "${activeMarket.question}" — Leader: ${
            [...activeMarket.outcomes].sort((a, b) => b.pct - a.pct)[0]?.label
          } (${[...activeMarket.outcomes].sort((a, b) => b.pct - a.pct)[0]?.pct.toFixed(1)}%)`
        : chatText.trim();

    if (!payloadText || sendingChat) return;
    setSendingChat(true);
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(activeGroupId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          body: payloadText,
          marketId: sharePoll && activeMarket ? activeMarket.id : null,
        }),
      });
      if (res.ok) {
        if (!sharePoll) setChatText("");
        await loadMessages(activeGroupId);
        await loadGroups();
      }
    } finally {
      setSendingChat(false);
    }
  }

  async function publishGroupPulse(e: React.FormEvent) {
    e.preventDefault();
    if (!activeGroupId || !pulseSummary.trim()) return;
    const res = await fetch(`/api/groups/${encodeURIComponent(activeGroupId)}/publish-pulse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        summary: pulseSummary,
        marketId: activeMarket?.id ?? null,
      }),
    });
    if (res.ok) {
      setPulseSummary("");
      setShowPulsePublisher(false);
      setGroupNotice("Published Group Consensus Pulse & pinned to Public Wall!");
      await loadWall();
    }
  }

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0];

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* LEFT: Single Anonymous Public Sentiment Wall */}
      <div className="min-w-0 space-y-3 rounded-lg border border-line bg-surface p-4 lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <EyeOff className="size-4 text-primary" />
              <h3 className="font-mono text-xs font-bold tracking-wider text-fg uppercase">
                {copy.wallTitle}
              </h3>
              <span className="rounded bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                ZERO USERNAMES · ANTI-SLOGAN SHIELD
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">{copy.wallSub}</p>
          </div>
        </div>

        {/* Compose Anonymous Thought */}
        <form onSubmit={submitWallPost} className="space-y-2.5 rounded-lg border border-line bg-bg/70 p-3">
          <div className="flex flex-wrap gap-1.5">
            {TONES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] transition-colors ${
                  tone === t.id
                    ? "border-primary bg-primary text-white font-bold"
                    : "border-line bg-surface text-muted hover:text-fg"
                }`}
              >
                {t.badge}
              </button>
            ))}
          </div>

          <textarea
            value={wallBody}
            onChange={(e) => setWallBody(e.target.value)}
            rows={2}
            placeholder={copy.wallPlaceholder}
            className="w-full rounded border border-line bg-surface p-2.5 text-xs text-fg outline-none placeholder:text-muted focus:border-primary"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
            <div className="flex flex-wrap items-center gap-3 text-muted">
              {activeMarket && (
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={tagActivePoll}
                    onChange={(e) => setTagActivePoll(e.target.checked)}
                    className="accent-primary"
                  />
                  <span>Tag active poll</span>
                </label>
              )}
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={attachStance}
                  onChange={(e) => setAttachStance(e.target.checked)}
                  className="accent-primary"
                />
                <span>Show backed side (no ID)</span>
              </label>
              <VoiceMicButton
                lang={lang}
                label={copy.voiceSpeak}
                onTranscript={(text) =>
                  setWallBody((prev) => (prev ? `${prev} ${text}` : text))
                }
              />
            </div>

            <button
              type="submit"
              disabled={postingWall || !wallBody.trim()}
              className="flex items-center gap-1.5 rounded bg-primary px-3.5 py-1.5 font-bold text-white hover:brightness-110 disabled:opacity-40"
            >
              <EyeOff className="size-3.5" />
              {postingWall ? copy.posting : copy.postAnonymously}
            </button>
          </div>

          {wallStatus && (
            <p className="font-mono text-[10px] font-semibold text-accent">{wallStatus}</p>
          )}
        </form>

        {/* Wall Filter & Accuracy Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
          <div className="flex rounded border border-line bg-bg p-0.5">
            <button
              type="button"
              onClick={() => setScopeFilter("all")}
              className={`rounded-xs px-2.5 py-1 ${
                scopeFilter === "all" ? "bg-primary text-white font-bold" : "text-muted"
              }`}
            >
              {copy.allIndiaWall}
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter("poll")}
              className={`rounded-xs px-2.5 py-1 ${
                scopeFilter === "poll" ? "bg-primary text-white font-bold" : "text-muted"
              }`}
            >
              {copy.thisPoll}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Skin-in-the-Game Accuracy Sort */}
            <button
              type="button"
              onClick={() => setSortBy((s) => (s === "latest" ? "calibrated" : "latest"))}
              className={`flex items-center gap-1 rounded border px-2.5 py-1 ${
                sortBy === "calibrated"
                  ? "border-cyan bg-cyan/15 text-cyan font-bold"
                  : "border-line bg-bg text-muted hover:text-fg"
              }`}
              title="Rank posts by Top 5% Accuracy Bracket without revealing usernames"
            >
              <Award className="size-3.5" />
              {sortBy === "calibrated" ? copy.topCalibrated : copy.sortLatest}
            </button>

            <button
              type="button"
              onClick={() => setVerifiedOnly((v) => !v)}
              className={`flex items-center gap-1 rounded border px-2.5 py-1 ${
                verifiedOnly
                  ? "border-primary bg-primary/15 text-primary font-bold"
                  : "border-line bg-bg text-muted"
              }`}
            >
              <ShieldCheck className="size-3.5" />
              OTP 1.0x
            </button>
          </div>
        </div>

        {/* Public Wall Feed */}
        <div className="space-y-2.5">
          {posts.map((p) => {
            const toneMeta = TONES.find((t) => t.id === p.tone) ?? TONES[0];
            return (
              <div
                key={p.id}
                className={`rounded-lg border p-3 ${
                  p.isPinnedPulse
                    ? "border-primary/50 bg-surface-elevated glow-primary"
                    : "border-line/80 bg-bg/60"
                }`}
              >
                {p.isPinnedPulse && (
                  <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-bold text-primary uppercase">
                    <Pin className="size-3" />
                    Pinned Group Consensus Pulse · {p.groupName}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded border border-line bg-surface px-2 py-0.5 font-bold text-fg">
                      {p.trustTier === "verified" ? (
                        <ShieldCheck className="size-3 text-primary" />
                      ) : (
                        <EyeOff className="size-3 text-muted" />
                      )}
                      {p.credibilityTag}
                    </span>
                    <span className="text-muted">· {p.city}</span>
                    {p.outcomeLabel && (
                      <span
                        className="rounded px-1.5 py-0.5 font-bold text-white"
                        style={{ backgroundColor: p.outcomeColor ?? "#0d9488" }}
                      >
                        Backed {p.outcomeLabel}
                      </span>
                    )}
                    {p.streakDays && p.streakDays >= 2 ? (
                      <span className="rounded bg-accent/15 px-1.5 py-0.5 font-bold text-accent">
                        🔥 {p.streakDays}d
                      </span>
                    ) : null}
                    {p.authorBadges?.slice(0, 1).map((b) => (
                      <span key={b} className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                        {b}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span>{toneMeta.badge}</span>
                    <span>· {relativeTime(p.createdAt)}</span>
                  </div>
                </div>

                {p.marketQuestion && (
                  <p className="mt-1.5 font-mono text-[10px] text-primary">
                    Re: {p.marketQuestion}
                  </p>
                )}

                <p className="mt-1.5 text-xs leading-relaxed text-fg">{p.body}</p>

                <div className="mt-2.5 flex items-center justify-between font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void reactToPost(p.id, "agree")}
                      className="flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-fg hover:border-primary"
                    >
                      <ThumbsUp className="size-3 text-primary" />
                      <span>Agree</span>
                      <strong className="text-primary">{p.agreeCount}</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => void reactToPost(p.id, "sharp")}
                      className="flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-fg hover:border-accent"
                    >
                      <Flame className="size-3 text-accent" />
                      <span>Sharp</span>
                      <strong className="text-accent">{p.sharpCount}</strong>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => void reactToPost(p.id, "flag")}
                    className="flex items-center gap-1 text-muted hover:text-crimson"
                    title="Flag spam or bot copy-paste"
                  >
                    <Flag className="size-3" />
                    Flag
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Build Groups & Ephemeral Burn Chat Rooms */}
      <div className="flex min-w-0 flex-col space-y-3 rounded-lg border border-line bg-surface p-4 lg:col-span-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <h3 className="font-mono text-xs font-bold tracking-wider text-fg uppercase">
                {copy.groupsTitle}
              </h3>
            </div>
            <p className="mt-0.5 text-[11px] text-muted">{copy.groupsSub}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateGroup((v) => !v)}
            className="flex items-center gap-1 rounded bg-primary px-2.5 py-1.5 font-mono text-[11px] font-bold text-white hover:brightness-110"
          >
            <Plus className="size-3.5" />
            {copy.newGroup}
          </button>
        </div>

        {/* Create Group Form */}
        {showCreateGroup && (
          <form onSubmit={createGroup} className="space-y-2 rounded-lg border border-primary/40 bg-bg p-3 font-mono text-xs">
            <p className="font-bold text-primary uppercase">Create New Sentiment Group</p>
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name (e.g. Varanasi Booth Watch)"
              className="w-full rounded border border-line bg-surface px-2.5 py-1.5 text-fg outline-none focus:border-primary"
            />
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={newGroupTopic}
                onChange={(e) => setNewGroupTopic(e.target.value)}
                className="rounded border border-line bg-surface px-2 py-1.5 text-fg outline-none"
              >
                <option value="Elections">Elections</option>
                <option value="Cricket">Cricket</option>
                <option value="Economy">Economy</option>
                <option value="Local Pulse">Local Pulse</option>
              </select>
              <label className="flex items-center gap-1 text-[11px] text-muted">
                <input
                  type="checkbox"
                  checked={newGroupPrivate}
                  onChange={(e) => setNewGroupPrivate(e.target.checked)}
                />
                Private
              </label>
              <label className="flex items-center gap-1 text-[11px] font-bold text-accent">
                <input
                  type="checkbox"
                  checked={newGroupBurn}
                  onChange={(e) => setNewGroupBurn(e.target.checked)}
                />
                🔥 24h Burn Room
              </label>
            </div>
            <input
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              placeholder="What will your group track?"
              className="w-full rounded border border-line bg-surface px-2.5 py-1.5 text-fg outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="w-full rounded bg-primary py-1.5 font-bold text-white hover:brightness-110"
            >
              Launch Group Room
            </button>
          </form>
        )}

        {groupNotice && (
          <p className="rounded border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-[11px] text-primary">
            {groupNotice}
          </p>
        )}

        {/* Group Selector Strip */}
        <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
          {groups.map((g) => {
            const isSel = activeGroup?.id === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveGroupId(g.id)}
                className={`w-full rounded border p-2.5 text-left transition-colors ${
                  isSel
                    ? "border-primary bg-surface-elevated"
                    : "border-line bg-bg/60 hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                  <span className="flex items-center gap-1.5 font-bold text-fg">
                    {g.isPrivate && <Lock className="size-3 text-accent" />}
                    {g.isBurnRoom && <Clock className="size-3 text-crimson" />}
                    {g.name}
                  </span>
                  {g.isBurnRoom ? (
                    <span className="rounded bg-crimson/15 px-1.5 py-0.5 text-[10px] font-bold text-crimson">
                      {burnCountdown(g.expiresAt)}
                    </span>
                  ) : (
                    <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-primary">
                      {g.memberCount} members
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-muted">{g.description}</p>
                {g.joined && g.myRoomMask && (
                  <p className="mt-1 font-mono text-[10px] font-semibold text-primary">
                    Your room mask: {g.myRoomMask}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Group Chat Stream */}
        {activeGroup && (
          <div className="flex flex-1 flex-col rounded-lg border border-line bg-bg/80 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 font-mono text-[11px]">
              <div className="flex items-center gap-1.5">
                <MessageCircle className="size-3.5 text-primary" />
                <span className="font-bold text-fg">{activeGroup.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex rounded border border-line bg-surface p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setGroupView("chat")}
                    className={`rounded-xs px-2 py-0.5 ${groupView === "chat" ? "bg-primary text-white font-bold" : "text-muted"}`}
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupView("rank")}
                    className={`flex items-center gap-1 rounded-xs px-2 py-0.5 ${groupView === "rank" ? "bg-primary text-white font-bold" : "text-muted"}`}
                  >
                    <Trophy className="size-2.5" /> Rank
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => copyGroupInviteLink(activeGroup)}
                  className="flex items-center gap-1 rounded border border-line bg-surface px-2 py-0.5 text-[10px] text-fg hover:border-primary"
                  title="Copy invite link for friends league"
                >
                  {copiedInvite ? <Check className="size-3 text-primary" /> : <Link2 className="size-3 text-primary" />}
                  {copiedInvite ? "Copied Link" : "Invite"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPulsePublisher((v) => !v)}
                  className="flex items-center gap-1 rounded border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary hover:bg-primary hover:text-white"
                  title="Pin a 1-sentence consensus summary from this group to the Public Wall"
                >
                  <Pin className="size-3" />
                  Pin to Wall
                </button>
                {activeGroup.joined ? (
                  <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-bold text-primary border border-line">
                    {activeGroup.myRoomMask}
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    {activeGroup.isPrivate && (
                      <input
                        value={inviteInput}
                        onChange={(e) => setInviteInput(e.target.value)}
                        placeholder="Code"
                        className="w-16 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px]"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => void joinGroup(activeGroup.id)}
                      className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-white"
                    >
                      Join Room
                    </button>
                  </div>
                )}
              </div>
            </div>

            {showPulsePublisher && (
              <form onSubmit={publishGroupPulse} className="mt-2 space-y-1.5 rounded border border-primary/40 bg-surface p-2 font-mono text-xs">
                <p className="text-[10px] font-bold text-primary uppercase">
                  Publish Group Consensus to Public Wall
                </p>
                <div className="flex gap-1.5">
                  <input
                    value={pulseSummary}
                    onChange={(e) => setPulseSummary(e.target.value)}
                    placeholder="1-sentence group summary..."
                    className="flex-1 rounded border border-line bg-bg px-2 py-1 text-xs outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="rounded bg-primary px-2.5 py-1 text-[10px] font-bold text-white"
                  >
                    Pin
                  </button>
                </div>
              </form>
            )}

            {activeGroup.inviteCode && (
              <p className="mt-1.5 font-mono text-[10px] text-accent">
                Private Invite Code: <strong>{activeGroup.inviteCode}</strong>
              </p>
            )}

            {groupView === "rank" ? (
              <div className="my-2.5 h-56 space-y-2 overflow-y-auto pr-1">
                <p className="font-mono text-[10px] uppercase text-muted">
                  Anonymous Friends League · Masked Accuracy Rank
                </p>
                {groupMembers.map((gm, i) => (
                  <div
                    key={gm.roomMask}
                    className={`flex items-center justify-between rounded border p-2 font-mono text-xs ${
                      gm.isMe ? "border-primary bg-primary/10" : "border-line/70 bg-surface"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gold">#{i + 1}</span>
                      <span className="font-bold text-fg">
                        {gm.roomMask} {gm.isMe ? "(You)" : ""}
                      </span>
                      {gm.trustTier === "verified" && <ShieldCheck className="size-3 text-primary" />}
                    </div>
                    <div className="text-right text-[10px]">
                      <span className="font-bold text-primary">{gm.accuracyPct.toFixed(1)}% Acc</span>
                      <span className="ml-2 text-accent">🔥 {gm.streakDays}d</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="my-2.5 h-56 space-y-2 overflow-y-auto pr-1">
                {messages.map((m) => {
                  const tagged = m.marketId ? markets.find((mk) => mk.id === m.marketId) : null;
                  return (
                    <div key={m.id} className="rounded border border-line/70 bg-surface p-2 text-xs">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="flex items-center gap-1 font-bold text-primary">
                          {m.roomMask}
                          {m.trustTier === "verified" && <ShieldCheck className="size-3 text-primary" />}
                        </span>
                        <span className="text-muted">{relativeTime(m.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-fg">{m.body}</p>
                      {tagged && (
                        <div className="mt-1.5 flex items-center gap-1 rounded bg-bg px-2 py-1 font-mono text-[10px] text-muted">
                          <BarChart2 className="size-3 text-primary" />
                          <span className="truncate">{tagged.question}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <form onSubmit={(e) => void sendGroupMessage(e, false)} className="space-y-1.5">
              <div className="flex gap-1.5">
                <input
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder={`Chat anonymously as ${activeGroup.myRoomMask ?? "Room Mask"}...`}
                  className="flex-1 rounded border border-line bg-surface px-2.5 py-1.5 font-mono text-xs text-fg outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={sendingChat || !chatText.trim()}
                  className="flex items-center gap-1 rounded bg-primary px-3 py-1.5 font-mono text-xs font-bold text-white hover:brightness-110 disabled:opacity-40"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
              {activeMarket && (
                <button
                  type="button"
                  onClick={(e) => void sendGroupMessage(e, true)}
                  className="flex items-center gap-1 font-mono text-[10px] text-primary hover:underline"
                >
                  <BarChart2 className="size-3" />
                  Share "{activeMarket.question.slice(0, 34)}..." live pulse in chat
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
