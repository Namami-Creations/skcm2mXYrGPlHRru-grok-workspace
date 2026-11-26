import type { Language } from "@/lib/types";

export type TranslationKeys = {
  brandSubtitle: string;
  zeroMoneyArena: string;
  arenaMode: string;
  proTerminal: string;
  verifiedIndependent: string;
  alertsOn: string;
  alertsOff: string;
  verified1x: string;
  guestVerify: string;
  livePulse: string;
  activeBattles: string;
  liveCountSuffix: string;
  searchPlaceholder: string;
  antiItCellActive: string;
  antiItCellSub: string;
  otpVerified: string;
  botsBlocked: string;
  shareCard: string;
  yourCallLocked: string;
  oneTapCall: string;
  stakeLabel: string;
  tabConsensus: string;
  tabWall: string;
  tabGeo: string;
  tabDebate: string;
  tabNews: string;
  tabTerminal: string;
  blackoutBannerTitle: string;
  blackoutBannerDesc: string;
  wallTitle: string;
  wallSub: string;
  wallPlaceholder: string;
  postAnonymously: string;
  posting: string;
  allIndiaWall: string;
  thisPoll: string;
  topCalibrated: string;
  sortLatest: string;
  groupsTitle: string;
  groupsSub: string;
  newGroup: string;
  cityRadarTitle: string;
  cityRadarSub: string;
  voiceSpeak: string;
};

const EN: TranslationKeys = {
  brandSubtitle: "1-Person-1-Vote Anti-IT-Cell Shield · Calibrated Human Consensus",
  zeroMoneyArena: "ZERO-MONEY ARENA",
  arenaMode: "Arena",
  proTerminal: "Pro Terminal",
  verifiedIndependent: "Verified Independent",
  alertsOn: "Alerts ON",
  alertsOff: "Alerts",
  verified1x: "Verified 1.0x",
  guestVerify: "Guest 0.25x · Verify",
  livePulse: "LIVE PULSE",
  activeBattles: "ACTIVE BATTLES",
  liveCountSuffix: "LIVE",
  searchPlaceholder: "Search UP 2027, IPL, RBI, NIFTY...",
  antiItCellActive: "ANTI-IT-CELL SHIELD ACTIVE",
  antiItCellSub: "· SHA-256 PoW + 1-Person-1-Vote Enforced",
  otpVerified: "OTP-Verified",
  botsBlocked: "Bots Blocked",
  shareCard: "Share Card",
  yourCallLocked: "Your Call Is Locked",
  oneTapCall: "1-Tap Call (Zero Money · Earn REP & Accuracy)",
  stakeLabel: "Stake",
  tabConsensus: "Live Chart",
  tabWall: "Anon Wall & Groups",
  tabGeo: "City Pulse",
  tabDebate: "Debate & League",
  tabNews: "News & Fact-Check",
  tabTerminal: "Pro Book & Ask India",
  blackoutBannerTitle: "ECI SECTION 126 QUIET WINDOW ACTIVE",
  blackoutBannerDesc:
    "Within 48 hours of polling, live tally shifts are paused per Representation of People Act Sec. 126. Anonymous issue discussion on the Community Wall remains open.",
  wallTitle: "Single Anonymous Public Wall",
  wallSub:
    "Speak openly without identity. Identical IT-cell copy-paste slogans auto-throttle for 60s.",
  wallPlaceholder:
    "Share your honest thought without any username (8s slow-mode + duplicate slogan shield active)...",
  postAnonymously: "Post Anonymously",
  posting: "Posting...",
  allIndiaWall: "All India Wall",
  thisPoll: "This Poll",
  topCalibrated: "Top Calibrated Voices",
  sortLatest: "Sort: Latest",
  groupsTitle: "Groups & 24h Burn Rooms",
  groupsSub: "Rotating per-room masks + optional 24h self-destruct timer.",
  newGroup: "New Group",
  cityRadarTitle: "Regional & City Divergence Radar",
  cityRadarSub:
    "Compare ground sentiment across cities (e.g., Varanasi vs. Lucknow) with human-verified weighting.",
  voiceSpeak: "Voice",
};

const HI: TranslationKeys = {
  brandSubtitle: "1-व्यक्ति-1-मत एंटी-IT-सेल सुरक्षा · सटीक मानव जनमत",
  zeroMoneyArena: "शून्य-धन अखाड़ा",
  arenaMode: "अखाड़ा",
  proTerminal: "प्रो टर्मिनल",
  verifiedIndependent: "स्वतंत्र व निष्पक्ष",
  alertsOn: "अलर्ट चालू",
  alertsOff: "अलर्ट",
  verified1x: "सत्यापित 1.0x",
  guestVerify: "अतिथि 0.25x · सत्यापित करें",
  livePulse: "लाइव पल्स",
  activeBattles: "सक्रिय मुकाबले",
  liveCountSuffix: "लाइव",
  searchPlaceholder: "यूपी 2027, IPL, RBI, NIFTY खोजें...",
  antiItCellActive: "एंटी-IT-सेल सुरक्षा सक्रिय",
  antiItCellSub: "· SHA-256 PoW + 1-व्यक्ति-1-मत लागू",
  otpVerified: "OTP-सत्यापित",
  botsBlocked: "बॉट ब्लॉक किए गए",
  shareCard: "शेयर कार्ड",
  yourCallLocked: "आपका मत दर्ज हो चुका है",
  oneTapCall: "1-टैप में अपना मत दर्ज करें (कोई पैसा नहीं)",
  stakeLabel: "दांव",
  tabConsensus: "लाइव चार्ट",
  tabWall: "गुमनाम वॉल व ग्रुप",
  tabGeo: "शहर व सीट मानचित्र",
  tabDebate: "बहस व लीग",
  tabNews: "समाचार व तथ्य-जांच",
  tabTerminal: "प्रो बुक व आस्क इंडिया",
  blackoutBannerTitle: "चुनाव आयोग धारा 126 साइलेंट पीरियड सक्रिय",
  blackoutBannerDesc:
    "मतदान से 48 घंटे पहले लाइव परिणाम संख्या अस्थायी रूप से रोकी गई है। जनहित मुद्दों पर गुमनाम चर्चा जारी है।",
  wallTitle: "सिंगल गुमनाम पब्लिक वॉल",
  wallSub: "बिना नाम बताए खुलकर लिखें। कॉपी-पेस्ट IT-सेल नारे 60 सेकंड के लिए स्वतः ब्लॉक होते हैं।",
  wallPlaceholder: "बिना किसी यूज़रनेम के अपनी ईमानदार राय लिखें (8s स्लो-मोड सक्रिय)...",
  postAnonymously: "गुमनाम पोस्ट करें",
  posting: "पोस्ट हो रहा है...",
  allIndiaWall: "पूरा भारत वॉल",
  thisPoll: "यह पोल",
  topCalibrated: "शीर्ष सटीक आवाज़ें",
  sortLatest: "क्रम: नवीनतम",
  groupsTitle: "ग्रुप और 24h बर्न रूम",
  groupsSub: "हर रूम में बदलता मास्क + 24 घंटे में स्वतः नष्ट होने वाला चैट रूम।",
  newGroup: "नया ग्रुप",
  cityRadarTitle: "क्षेत्रीय और शहर भावना रडार",
  cityRadarSub: "वाराणसी बनाम लखनऊ जैसे शहरों की ज़मीनी भावना और क्षेत्रीय रुझान देखें।",
  voiceSpeak: "बोलें",
};

export function t(lang: Language): TranslationKeys {
  return lang === "hi" ? HI : EN;
}
