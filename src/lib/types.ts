export type CategoryId =
  | "elections"
  | "cricket"
  | "economy"
  | "football"
  | "shares"
  | "sponsored";

export type UiMode = "arena" | "terminal";
export type Language = "en" | "hi";
export type TrustTier = "guest" | "verified";

export type Outcome = {
  id: string;
  label: string;
  labelHi?: string;
  color: string;
  rawVotes: number;
  weightedVotes: number;
  superforecasterVotes: number;
  pct: number;
  superPct: number;
};

export type MarketSummary = {
  id: string;
  category: CategoryId;
  question: string;
  questionHi?: string;
  blurb: string;
  blurbHi?: string;
  imageUrl?: string;
  closesAt: string;
  status: "open" | "settled";
  blackoutActive?: boolean;
  sponsored: boolean;
  sponsor: string | null;
  stake: number;
  league: string;
  isHotBattle?: boolean;
  resolutionOracle: string;
  resolutionRule: string;
  outcomes: Outcome[];
  totalWeightedVotes: number;
  totalRawVotes: number;
  verifiedPct: number;
  sybilsBlocked: number;
  myOutcomeId: string | null;
};

export type ChartPoint = {
  t: number;
  eventMarker?: string;
  crowd: Record<string, number>;
  superforecaster: Record<string, number>;
};

export type CityBreakdown = {
  city: string;
  state: string;
  totalVotes: number;
  verifiedSharePct: number;
  dominantOutcomeId: string;
  divergencePct: number;
  shares: Record<string, number>;
};

export type DebatePost = {
  id: number;
  marketId: string;
  handle: string;
  badge: string;
  accuracyPct: number;
  tier: TrustTier;
  outcomeId: string;
  body: string;
  upvotes: number;
  createdAt: number;
};

export type NewsArticle = {
  id: string;
  source: string;
  domain: string;
  title: string;
  snippet: string;
  publishedAgo: string;
  url: string;
  tag: string;
  verifiedFacts: string[];
  isLiveRss?: boolean;
};

export type FactCheckResult = {
  marketId: string;
  leaderLabel: string;
  leaderPct: number;
  divergenceLabel: string;
  confidencePct: number;
  oracleName: string;
  oracleRule: string;
  summary: string;
  articles: NewsArticle[];
  checkedAt: number;
};

export type LeaderboardEntry = {
  handle: string;
  badge: string;
  league: string;
  accuracyPct: number;
  rep: number;
  callsCount: number;
  tier: TrustTier;
};

export type MarketDetailResponse = {
  market: MarketSummary;
  chart: ChartPoint[];
  cities: CityBreakdown[];
  debates: DebatePost[];
  velocityPerMin: number;
  volume24h: number[];
  recentReactions: { emoji: string; label: string; count: number }[];
};

export type UserProfile = {
  token: string;
  handle: string;
  tier: TrustTier;
  phoneMasked?: string;
  city: string;
  rep: number;
  accuracyPct: number;
  badge: string;
  powSolved: number;
  streakDays: number;
  badges: string[];
};

export type SentimentTone = "insight" | "shift" | "contrarian" | "open";

export type WallPost = {
  id: number;
  marketId: string | null;
  marketQuestion?: string;
  outcomeLabel?: string;
  outcomeColor?: string;
  city: string;
  trustTier: TrustTier;
  credibilityTag: string;
  accuracyRank: number;
  authorBadges?: string[];
  streakDays?: number;
  isPinnedPulse?: boolean;
  groupName?: string;
  tone: SentimentTone;
  body: string;
  agreeCount: number;
  sharpCount: number;
  createdAt: number;
};

export type CommunityGroup = {
  id: string;
  name: string;
  topic: string;
  description: string;
  isPrivate: boolean;
  isBurnRoom: boolean;
  expiresAt?: number | null;
  inviteCode?: string;
  memberCount: number;
  marketId: string | null;
  joined: boolean;
  myRoomMask?: string;
  createdAt: number;
};

export type GroupMessage = {
  id: number;
  groupId: string;
  roomMask: string;
  trustTier: TrustTier;
  marketId: string | null;
  body: string;
  createdAt: number;
};

export type GroupLeaderboardMember = {
  roomMask: string;
  trustTier: TrustTier;
  accuracyPct: number;
  callsCount: number;
  streakDays: number;
  isMe: boolean;
};

export type UPZone = "Purvanchal" | "Awadh" | "West UP" | "Bundelkhand" | "Rohilkhand";

export type ConstituencySeat = {
  id: string;
  seatNo: number;
  name: string;
  zone: UPZone;
  district: string;
  totalVotes: number;
  shares: Record<string, number>;
  leaderId: string;
  myVoteId: string | null;
};

export type ExitPollRecord = {
  id: string;
  cycle: string;
  metric: string;
  oracleBlackCall: string;
  cvoterCall: string;
  axisCall: string;
  actualResult: string;
  oracleErrorPct: number;
  cvoterErrorPct: number;
  axisErrorPct: number;
  status: "settled" | "live";
};
