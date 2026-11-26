import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(path.join(dataDir, "arena.sqlite"));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS markets (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    question_hi TEXT,
    blurb TEXT NOT NULL,
    blurb_hi TEXT,
    closes_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    sponsored INTEGER NOT NULL DEFAULT 0,
    sponsor TEXT,
    stake INTEGER NOT NULL DEFAULT 50,
    league TEXT NOT NULL,
    is_hot_battle INTEGER NOT NULL DEFAULT 0,
    resolution_oracle TEXT NOT NULL,
    resolution_rule TEXT NOT NULL,
    sybils_blocked INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS outcomes (
    market_id TEXT NOT NULL,
    id TEXT NOT NULL,
    label TEXT NOT NULL,
    label_hi TEXT,
    color TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (market_id, id),
    FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS users (
    token TEXT PRIMARY KEY,
    handle TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'guest',
    phone_masked TEXT,
    city TEXT NOT NULL DEFAULT 'Lucknow',
    state TEXT NOT NULL DEFAULT 'Uttar Pradesh',
    rep INTEGER NOT NULL DEFAULT 1000,
    accuracy_pct REAL NOT NULL DEFAULT 74.0,
    badge TEXT NOT NULL DEFAULT 'Arena Challenger',
    is_superforecaster INTEGER NOT NULL DEFAULT 0,
    pow_solved INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ballots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_id TEXT NOT NULL,
    outcome_id TEXT NOT NULL,
    voter_token TEXT NOT NULL,
    trust_tier TEXT NOT NULL DEFAULT 'guest',
    weight REAL NOT NULL DEFAULT 0.25,
    is_superforecaster INTEGER NOT NULL DEFAULT 0,
    city TEXT NOT NULL DEFAULT 'Lucknow',
    state TEXT NOT NULL DEFAULT 'Uttar Pradesh',
    created_at INTEGER NOT NULL,
    UNIQUE (market_id, voter_token),
    FOREIGN KEY (market_id, outcome_id) REFERENCES outcomes(market_id, id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_ballots_market_time ON ballots(market_id, created_at);

  CREATE TABLE IF NOT EXISTS debates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_id TEXT NOT NULL,
    handle TEXT NOT NULL,
    badge TEXT NOT NULL,
    accuracy_pct REAL NOT NULL,
    tier TEXT NOT NULL,
    outcome_id TEXT NOT NULL,
    body TEXT NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reactions (
    market_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    label TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (market_id, emoji)
  );

  CREATE TABLE IF NOT EXISTS sponsored_campaigns (
    id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL,
    question TEXT NOT NULL,
    target_region TEXT NOT NULL,
    budget_inr INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wall_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_id TEXT,
    outcome_id TEXT,
    city TEXT NOT NULL DEFAULT 'India',
    trust_tier TEXT NOT NULL DEFAULT 'guest',
    credibility_tag TEXT NOT NULL DEFAULT 'Anonymous Citizen',
    accuracy_rank REAL NOT NULL DEFAULT 50.0,
    is_pinned_pulse INTEGER NOT NULL DEFAULT 0,
    group_name TEXT,
    normalized_body TEXT,
    tone TEXT NOT NULL DEFAULT 'open',
    body TEXT NOT NULL,
    agree_count INTEGER NOT NULL DEFAULT 0,
    sharp_count INTEGER NOT NULL DEFAULT 0,
    flag_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT NOT NULL,
    is_private INTEGER NOT NULL DEFAULT 0,
    is_burn_room INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER,
    invite_code TEXT,
    market_id TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS group_members (
    group_id TEXT NOT NULL,
    voter_token TEXT NOT NULL,
    room_mask TEXT NOT NULL,
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (group_id, voter_token),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS group_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    room_mask TEXT NOT NULL,
    trust_tier TEXT NOT NULL DEFAULT 'guest',
    market_id TEXT,
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS constituency_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    constituency_id TEXT NOT NULL,
    market_id TEXT NOT NULL,
    outcome_id TEXT NOT NULL,
    voter_token TEXT NOT NULL,
    weight REAL NOT NULL DEFAULT 1.0,
    created_at INTEGER NOT NULL,
    UNIQUE (constituency_id, voter_token)
  );
`);

export const UP_CONSTITUENCIES = [
  { id: "varanasi-north", seatNo: 388, name: "Varanasi North", zone: "Purvanchal", district: "Varanasi" },
  { id: "gorakhpur-urban", seatNo: 322, name: "Gorakhpur Urban", zone: "Purvanchal", district: "Gorakhpur" },
  { id: "azamgarh", seatNo: 347, name: "Azamgarh Sadar", zone: "Purvanchal", district: "Azamgarh" },
  { id: "ghazipur", seatNo: 375, name: "Ghazipur", zone: "Purvanchal", district: "Ghazipur" },
  { id: "lucknow-central", seatNo: 174, name: "Lucknow Central", zone: "Awadh", district: "Lucknow" },
  { id: "ayodhya", seatNo: 275, name: "Ayodhya", zone: "Awadh", district: "Ayodhya" },
  { id: "amethi", seatNo: 186, name: "Amethi", zone: "Awadh", district: "Amethi" },
  { id: "rae-bareli", seatNo: 180, name: "Rae Bareli", zone: "Awadh", district: "Rae Bareli" },
  { id: "noida", seatNo: 61, name: "Noida", zone: "West UP", district: "Gautam Buddha Nagar" },
  { id: "meerut", seatNo: 48, name: "Meerut", zone: "West UP", district: "Meerut" },
  { id: "agra-south", seatNo: 89, name: "Agra South", zone: "West UP", district: "Agra" },
  { id: "muzaffarnagar", seatNo: 14, name: "Muzaffarnagar", zone: "West UP", district: "Muzaffarnagar" },
  { id: "jhansi-nagar", seatNo: 223, name: "Jhansi Nagar", zone: "Bundelkhand", district: "Jhansi" },
  { id: "banda", seatNo: 235, name: "Banda", zone: "Bundelkhand", district: "Banda" },
  { id: "bareilly", seatNo: 124, name: "Bareilly", zone: "Rohilkhand", district: "Bareilly" },
  { id: "rampur", seatNo: 37, name: "Rampur", zone: "Rohilkhand", district: "Rampur" },
] as const;

function seedCommunityIfEmpty() {
  // Ensure schema migrations for existing SQLite files
  const safeAlter = (sql: string) => {
    try {
      db.exec(sql);
    } catch {
      // column already exists
    }
  };
  safeAlter("ALTER TABLE wall_posts ADD COLUMN accuracy_rank REAL NOT NULL DEFAULT 50.0");
  safeAlter("ALTER TABLE wall_posts ADD COLUMN is_pinned_pulse INTEGER NOT NULL DEFAULT 0");
  safeAlter("ALTER TABLE wall_posts ADD COLUMN group_name TEXT");
  safeAlter("ALTER TABLE wall_posts ADD COLUMN normalized_body TEXT");
  safeAlter("ALTER TABLE wall_posts ADD COLUMN author_badges TEXT NOT NULL DEFAULT '[]'");
  safeAlter("ALTER TABLE wall_posts ADD COLUMN streak_days INTEGER NOT NULL DEFAULT 0");
  safeAlter("ALTER TABLE groups ADD COLUMN is_burn_room INTEGER NOT NULL DEFAULT 0");
  safeAlter("ALTER TABLE groups ADD COLUMN expires_at INTEGER");
  safeAlter("ALTER TABLE users ADD COLUMN streak_days INTEGER NOT NULL DEFAULT 1");
  safeAlter("ALTER TABLE users ADD COLUMN last_vote_at INTEGER");
  safeAlter("ALTER TABLE users ADD COLUMN badges TEXT NOT NULL DEFAULT '[]'");
  safeAlter("ALTER TABLE markets ADD COLUMN blackout_active INTEGER NOT NULL DEFAULT 0");

  const constCnt = db.prepare("SELECT COUNT(*) as cnt FROM constituency_votes").get() as { cnt: number };
  if (constCnt.cnt === 0) {
    const insertSeatVote = db.prepare(`
      INSERT INTO constituency_votes (constituency_id, market_id, outcome_id, voter_token, weight, created_at)
      VALUES (?, 'up-election-2027', ?, ?, ?, ?)
    `);
    const nowSeat = Date.now();
    UP_CONSTITUENCIES.forEach((seat, sIdx) => {
      const counts: Record<string, number> =
        seat.zone === "Purvanchal"
          ? { bjp: 14, sp: 13, inc: 3, bsp: 3, oth: 2 }
          : seat.zone === "Awadh"
            ? { bjp: 15, sp: 10, inc: 6, bsp: 2, oth: 2 }
            : seat.zone === "West UP"
              ? { bjp: 16, sp: 12, inc: 3, bsp: 4, oth: 2 }
              : seat.zone === "Bundelkhand"
                ? { bjp: 13, sp: 11, inc: 3, bsp: 4, oth: 1 }
                : { bjp: 12, sp: 14, inc: 4, bsp: 3, oth: 2 };
      if (seat.id === "gorakhpur-urban" || seat.id === "ayodhya" || seat.id === "noida") {
        counts.bjp += 8;
      }
      if (seat.id === "azamgarh" || seat.id === "rampur") {
        counts.sp += 7;
      }
      if (seat.id === "rae-bareli" || seat.id === "amethi") {
        counts.inc += 9;
      }
      let seq = 0;
      for (const [outcomeId, num] of Object.entries(counts)) {
        for (let k = 0; k < num; k++) {
          seq++;
          insertSeatVote.run(
            seat.id,
            outcomeId,
            `seed-seat-${sIdx}-${seq}`,
            1.0,
            nowSeat - seq * 60_000,
          );
        }
      }
    });
  }

  const wallCnt = db.prepare("SELECT COUNT(*) as cnt FROM wall_posts").get() as { cnt: number };
  const now = Date.now();
  if (wallCnt.cnt === 0) {
    const insertWall = db.prepare(`
      INSERT INTO wall_posts (market_id, outcome_id, city, trust_tier, credibility_tag, accuracy_rank, is_pinned_pulse, group_name, normalized_body, tone, body, agree_count, sharp_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertWall.run(
      "up-election-2027",
      "sp",
      "Varanasi",
      "verified",
      "UP 2027 Ground Pulse · Group Consensus",
      95.0,
      1,
      "UP 2027 Ground Pulse",
      "varanasiboothwatchgroupconsensustighteningmargininruralpockets",
      "shift",
      "Group Consensus Summary: Varanasi & Purvanchal rural pockets show a tightening contest while urban belts hold steady.",
      58,
      31,
      now - 4200_000,
    );
    insertWall.run(
      "up-election-2027",
      "sp",
      "Prayagraj",
      "verified",
      "Verified Human (1.0x)",
      84.0,
      0,
      null,
      "notvchanneltalksaboutthisbutruralyouthturnout",
      "shift",
      "No TV channel talks about this, but rural youth turnout around Prayagraj & Kaushambi feels way tighter than headlines suggest. People are voting quietly without putting flags on bikes.",
      28,
      19,
      now - 5400_000,
    );
    insertWall.run(
      "rbi-repo-rate-dec",
      "hold",
      "Mumbai",
      "verified",
      "Top 5% Calibrated Voice",
      93.5,
      0,
      null,
      "vegetablepricesatlocalmandishaventcooledyet",
      "insight",
      "Vegetable prices at local mandis haven't cooled yet. Hard to see RBI rushing a 25 bps cut before food inflation settles below 4.5%.",
      22,
      15,
      now - 3600_000,
    );
    insertWall.run(
      "ipl-t20-chase-tonight",
      "chase",
      "Bengaluru",
      "verified",
      "Verified Human (1.0x)",
      81.0,
      0,
      null,
      "honestlygladthereszeromoneyherejustpurecricketlogic",
      "open",
      "Honestly glad there's zero money here—just pure cricket logic. Evening humidity is sticky tonight; chasing side has a huge dew advantage after the 13th over.",
      31,
      12,
      now - 1800_000,
    );
    insertWall.run(
      null,
      null,
      "Lucknow",
      "guest",
      "Anonymous Citizen",
      62.0,
      0,
      null,
      "tiredofpaiditcellnoiseonxandbiasedexitpolls",
      "contrarian",
      "Tired of paid IT-cell noise on X and biased exit polls. An anonymous human-verified wall where ideas stand on logic alone was badly needed.",
      44,
      27,
      now - 900_000,
    );
  }

  const grpCnt = db.prepare("SELECT COUNT(*) as cnt FROM groups").get() as { cnt: number };
  if (grpCnt.cnt === 0) {
    const insertGrp = db.prepare(`
      INSERT INTO groups (id, name, topic, description, is_private, is_burn_room, expires_at, invite_code, market_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMsg = db.prepare(`
      INSERT INTO group_messages (group_id, room_mask, trust_tier, market_id, body, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertGrp.run(
      "grp-up-ground",
      "UP 2027 Ground Pulse",
      "Elections",
      "Anonymous constituency-by-constituency notes from Lucknow, Varanasi, Kanpur & Doab belts.",
      0,
      0,
      null,
      null,
      "up-election-2027",
      now - 86400_000,
    );
    insertGrp.run(
      "grp-ipl-tacticians",
      "IPL Night Burn Room",
      "Cricket",
      "24h ephemeral match-day room: dew factor & chase probability. Auto-clears in 24h.",
      0,
      1,
      now + 22 * 3600_000,
      null,
      "ipl-t20-chase-tonight",
      now - 7200_000,
    );
    insertGrp.run(
      "grp-macro-hawks",
      "RBI & NIFTY Macro Desk",
      "Economy",
      "Rate-cut probabilities, CPI prints, and FII/DII flows without finfluencer spam.",
      0,
      0,
      null,
      null,
      "rbi-repo-rate-dec",
      now - 54000_000,
    );

    insertMsg.run("grp-up-ground", "Mask #14", "verified", "up-election-2027", "Kanpur urban traders are still leaning incumbent, while neighboring rural belts look super competitive.", now - 4000_000);
    insertMsg.run("grp-up-ground", "Mask #07", "verified", "up-election-2027", "Same vibe in Varanasi outskirts—expressway infra helps, but local candidate selection will decide.", now - 2200_000);
    insertMsg.run("grp-ipl-tacticians", "Mask #29", "verified", "ipl-t20-chase-tonight", "Grass cover looks thin today, ball won't grip after 9 PM. Messages here self-destruct after 24h.", now - 1500_000);
    insertMsg.run("grp-macro-hawks", "Mask #03", "verified", "rbi-repo-rate-dec", "Watching next week's bond yield reaction closely before locking my call.", now - 2500_000);
  }
}

function seedDatabaseIfEmpty() {
  const countRow = db.prepare("SELECT COUNT(*) as cnt FROM markets").get() as { cnt: number };
  if (countRow.cnt > 0) return;

  const now = Date.now();
  const hours = (h: number) => new Date(now + h * 3600_000).toISOString();

  const insertMarket = db.prepare(`
    INSERT INTO markets (id, category, question, question_hi, blurb, blurb_hi, closes_at, status, sponsored, sponsor, stake, league, is_hot_battle, resolution_oracle, resolution_rule, sybils_blocked, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOutcome = db.prepare(`
    INSERT INTO outcomes (market_id, id, label, label_hi, color, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertDebate = db.prepare(`
    INSERT INTO debates (market_id, handle, badge, accuracy_pct, tier, outcome_id, body, upvotes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReaction = db.prepare(`
    INSERT INTO reactions (market_id, emoji, label, count)
    VALUES (?, ?, ?, ?)
  `);

  // 1. UP Assembly Election 2027 (Hero Political Market)
  insertMarket.run(
    "up-election-2027",
    "elections",
    "Who will win the Uttar Pradesh Assembly Election 2027?",
    "उत्तर प्रदेश विधानसभा चुनाव 2027 कौन जीतेगा?",
    "403-seat state legislative consensus. Weighted by verified human voters across UP districts.",
    "403 सीटों की विधानसभा का जनमत। यूपी के सभी जिलों से सत्यापित मतदाताओं के आधार पर।",
    hours(2760),
    0,
    null,
    50,
    "UP Election Cycle 2027",
    1,
    "Election Commission of India (ECI) Official Gazette",
    "Resolves to the political party or alliance securing 202+ seats in the 403-member UP Legislative Assembly.",
    142,
    1,
  );

  const upParties = [
    ["bjp", "BJP (Bharatiya Janata Party)", "भाजपा (BJP)", "#f97316", 1],
    ["sp", "SP (Samajwadi Party)", "सपा (SP)", "#f43f5e", 2],
    ["bsp", "BSP (Bahujan Samaj Party)", "बसपा (BSP)", "#38bdf8", 3],
    ["inc", "Congress (INC)", "कांग्रेस (INC)", "#2fce8a", 4],
    ["oth", "Others & Independents", "अन्य व निर्दलीय", "#a855f7", 5],
  ] as const;

  for (const [id, label, labelHi, color, sort] of upParties) {
    insertOutcome.run("up-election-2027", id, label, labelHi, color, sort);
  }

  // 2. IPL / Cricket Live Match
  insertMarket.run(
    "ipl-t20-chase-tonight",
    "cricket",
    "T20 Match Night: Does the chasing side win tonight?",
    "टी20 मैच नाइट: क्या आज रात लक्ष्य का पीछा करने वाली टीम जीतेगी?",
    "Dew factor vs. scoreboard pressure in the final 6 overs. Zero-money fan consensus.",
    "आखिरी 6 ओवरों में ओस बनाम स्कोरबोर्ड का दबाव। बिना पैसे का शुद्ध प्रशंसक जनमत।",
    hours(5),
    0,
    null,
    25,
    "IPL Season 2027",
    1,
    "Official BCCI / IPL Match Scorecard",
    "Resolves to Chasing Side if team batting second wins (excluding Super Over tie-breakers).",
    63,
    2,
  );
  insertOutcome.run("ipl-t20-chase-tonight", "chase", "Chasing Side Wins", "पीछा करने वाली टीम", "#2fce8a", 1);
  insertOutcome.run("ipl-t20-chase-tonight", "defend", "Defending Side Wins", "बचाव करने वाली टीम", "#f97316", 2);
  insertOutcome.run("ipl-t20-chase-tonight", "super", "Super Over Tie", "सुपर ओवर टाई", "#38bdf8", 3);

  // 3. RBI MPC Repo Rate
  insertMarket.run(
    "rbi-repo-rate-dec",
    "economy",
    "RBI MPC Policy: Will RBI cut the Repo Rate by 25 bps?",
    "RBI मौद्रिक नीति: क्या RBI रेपो रेट में 25 bps की कटौती करेगा?",
    "CPI food inflation vs. GDP growth momentum ahead of the Monetary Policy Committee statement.",
    "मुद्रास्फीति बनाम जीडीपी विकास दर पर RBI मौद्रिक नीति समिति के फैसले का अनुमान।",
    hours(420),
    0,
    null,
    50,
    "RBI Macro Quarter",
    0,
    "Reserve Bank of India (RBI) Official Press Release",
    "Resolves to Cut 25 bps if the benchmark policy repo rate is lowered by at least 0.25%.",
    38,
    3,
  );
  insertOutcome.run("rbi-repo-rate-dec", "cut", "Cut 25 bps", "25 bps कटौती", "#2fce8a", 1);
  insertOutcome.run("rbi-repo-rate-dec", "hold", "Hold Steady", "दरें स्थिर रहेंगी", "#fbbf24", 2);
  insertOutcome.run("rbi-repo-rate-dec", "hike", "Hike / Surprise", "बढ़ोतरी / सरप्राइज", "#f43f5e", 3);

  // 4. NIFTY 50 Monthly Milestone
  insertMarket.run(
    "nifty-26k-milestone",
    "shares",
    "Will NIFTY 50 close above 26,000 at month-end?",
    "क्या महीने के अंत में NIFTY 50 26,000 के ऊपर बंद होगा?",
    "FII outflows vs. domestic SIP inflows across large-cap banking and IT counters.",
    "विदेशी निवेश (FII) बनाम घरेलू SIP प्रवाह के बीच NIFTY 50 का मासिक स्तर।",
    hours(290),
    0,
    null,
    50,
    "RBI Macro Quarter",
    0,
    "National Stock Exchange (NSE) Closing Index",
    "Resolves to Above 26,000 if official NSE closing print on the final trading day exceeds 26,000.00.",
    29,
    4,
  );
  insertOutcome.run("nifty-26k-milestone", "above", "Above 26,000", "26,000 से ऊपर", "#2fce8a", 1);
  insertOutcome.run("nifty-26k-milestone", "below", "Below 26,000", "26,000 से नीचे", "#f43f5e", 2);

  // 5. Bitcoin Macro
  insertMarket.run(
    "btc-120k-macro",
    "shares",
    "Will Bitcoin print above $120,000 before year-end?",
    "क्या साल के अंत से पहले बिटकॉइन $120,000 के पार जाएगा?",
    "Global institutional ETF inflows and sovereign liquidity sentiment.",
    "वैश्विक ETF निवेश और मैक्रो लिक्विडिटी पर आधारित अनुमान।",
    hours(720),
    0,
    null,
    50,
    "Global Macro League",
    0,
    "CME CF Bitcoin Reference Rate",
    "Resolves Yes if spot reference rate prints >= $120,000 UTC before Dec 31.",
    51,
    5,
  );
  insertOutcome.run("btc-120k-macro", "yes", "Yes · Above $120k", "हाँ · $120k के ऊपर", "#2fce8a", 1);
  insertOutcome.run("btc-120k-macro", "no", "No · Stays Below", "नहीं · नीचे रहेगा", "#f97316", 2);

  // 6. Sponsored Ask India B2B Market
  insertMarket.run(
    "ev-two-wheeler-tier2",
    "sponsored",
    "Ask India Pulse: Which EV 2-wheeler leads Tier-2 UP adoption?",
    "आस्क इंडिया पल्स: टियर-2 यूपी शहरों में कौन सा EV टू-व्हीलर आगे है?",
    "Sponsored consumer sentiment study across Lucknow, Kanpur, Varanasi, and Agra dealerships.",
    "लखनऊ, कानपुर, वाराणसी और आगरा में उपभोक्ता पसंद पर प्रायोजित सर्वेक्षण।",
    hours(600),
    1,
    "Bharat Mobility Labs",
    25,
    "UP Consumer Pulse",
    0,
    "VAHAN Registration & Verified Consumer Survey",
    "Measures live consumer brand preference in Tier-2 North Indian cities.",
    19,
    6,
  );
  insertOutcome.run("ev-two-wheeler-tier2", "tvs", "TVS iQube", "टीवीएस आईक्यूब", "#38bdf8", 1);
  insertOutcome.run("ev-two-wheeler-tier2", "bajaj", "Bajaj Chetak", "बजाज चेतक", "#2fce8a", 2);
  insertOutcome.run("ev-two-wheeler-tier2", "ola", "Ola Electric", "ओला इलेक्ट्रिक", "#f97316", 3);
  insertOutcome.run("ev-two-wheeler-tier2", "ather", "Ather Energy", "एथर एनर्जी", "#fbbf24", 4);

  // Seed ballots across UP cities and other hubs with realistic Superforecaster divergence
  const upCities = [
    ["Lucknow", "Uttar Pradesh"],
    ["Varanasi", "Uttar Pradesh"],
    ["Kanpur", "Uttar Pradesh"],
    ["Agra", "Uttar Pradesh"],
    ["Prayagraj", "Uttar Pradesh"],
    ["Meerut", "Uttar Pradesh"],
    ["Noida", "Uttar Pradesh"],
    ["Gorakhpur", "Uttar Pradesh"],
    ["Ayodhya", "Uttar Pradesh"],
    ["Bareilly", "Uttar Pradesh"],
  ] as const;

  const metroCities = [
    ["Mumbai", "Maharashtra"],
    ["Bengaluru", "Karnataka"],
    ["New Delhi", "Delhi"],
    ["Hyderabad", "Telangana"],
    ["Chennai", "Tamil Nadu"],
    ["Pune", "Maharashtra"],
    ["Ahmedabad", "Gujarat"],
    ["Kolkata", "West Bengal"],
  ] as const;

  const insertBallot = db.prepare(`
    INSERT INTO ballots (market_id, outcome_id, voter_token, trust_tier, weight, is_superforecaster, city, state, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Seed 220 ballots for UP Election 2027 over last 12 hours
  for (let i = 0; i < 220; i++) {
    const [city, state] = upCities[i % upCities.length];
    const isSuper = i % 9 === 0 ? 1 : 0;
    const isVerified = i % 5 !== 0 ? 1 : 0;
    const tier = isVerified ? "verified" : "guest";
    const weight = isVerified ? 1.0 : 0.25;
    const wave = Math.sin(i / 14);
    // Superforecasters lean slightly closer (BJP vs SP tighter margin)
    const mod = (i * 37 + (city === "Varanasi" ? 3 : city === "Prayagraj" ? 11 : 0)) % 100;
    let outcome = "oth";
    if (isSuper) {
      if (mod < 36) outcome = "bjp";
      else if (mod < 74) outcome = "sp";
      else if (mod < 86) outcome = "bsp";
      else if (mod < 95) outcome = "inc";
    } else {
      if (mod < 41 + Math.round(wave * 4)) outcome = "bjp";
      else if (mod < 74 + Math.round(wave * 3)) outcome = "sp";
      else if (mod < 86) outcome = "bsp";
      else if (mod < 95) outcome = "inc";
    }
    const createdAt = now - (220 - i) * 195_000;
    insertBallot.run("up-election-2027", outcome, `seed-up-${i}`, tier, weight, isSuper, city, state, createdAt);
  }

  // Seed ballots for other markets
  const otherSeeds: Array<{ marketId: string; choices: string[]; weights: number[]; superBias: string; count: number }> = [
    { marketId: "ipl-t20-chase-tonight", choices: ["chase", "defend", "super"], weights: [56, 38, 6], superBias: "chase", count: 140 },
    { marketId: "rbi-repo-rate-dec", choices: ["cut", "hold", "hike"], weights: [54, 41, 5], superBias: "hold", count: 150 },
    { marketId: "nifty-26k-milestone", choices: ["above", "below"], weights: [58, 42], superBias: "above", count: 130 },
    { marketId: "btc-120k-macro", choices: ["yes", "no"], weights: [60, 40], superBias: "yes", count: 145 },
    { marketId: "ev-two-wheeler-tier2", choices: ["tvs", "bajaj", "ola", "ather"], weights: [34, 28, 22, 16], superBias: "tvs", count: 120 },
  ];

  for (const seed of otherSeeds) {
    for (let i = 0; i < seed.count; i++) {
      const pool = seed.marketId === "ev-two-wheeler-tier2" ? upCities : metroCities;
      const [city, state] = pool[i % pool.length];
      const isSuper = i % 10 === 0 ? 1 : 0;
      const isVerified = i % 4 !== 0 ? 1 : 0;
      const tier = isVerified ? "verified" : "guest";
      const weight = isVerified ? 1.0 : 0.25;
      let outcome = seed.choices[0];
      if (isSuper && i % 20 === 0) {
        outcome = seed.superBias;
      } else {
        const roll = (i * 29 + 11) % 100;
        let acc = 0;
        for (let k = 0; k < seed.choices.length; k++) {
          acc += seed.weights[k];
          if (roll < acc) {
            outcome = seed.choices[k];
            break;
          }
        }
      }
      const createdAt = now - (seed.count - i) * 240_000;
      insertBallot.run(seed.marketId, outcome, `seed-${seed.marketId}-${i}`, tier, weight, isSuper, city, state, createdAt);
    }
  }

  // Seed debate rationales
  insertDebate.run(
    "up-election-2027",
    "Lucknow_Quant",
    "92% Accurate on UP Politics",
    92.4,
    "verified",
    "bjp",
    "Infrastructure delivery along Purvanchal & Ganga Expressways plus booth-level mobilization keeps NDA ahead in urban and semi-urban seats.",
    42,
    now - 7200_000,
  );
  insertDebate.run(
    "up-election-2027",
    "Awadh_Forecaster",
    "Top 5% Macro & Polls",
    88.1,
    "verified",
    "sp",
    "PDA coalition arithmetic and agrarian youth consolidation in central Doab and Purvanchal create a much tighter margin than 2022.",
    37,
    now - 3600_000,
  );
  insertDebate.run(
    "ipl-t20-chase-tonight",
    "Wankhede_Pulse",
    "Top 1% IPL Forecaster",
    94.2,
    "verified",
    "chase",
    "Evening humidity is 74% — heavy dew after over 12 makes gripping the wet ball nearly impossible for finger spinners.",
    29,
    now - 1800_000,
  );
  insertDebate.run(
    "rbi-repo-rate-dec",
    "Mint_Street_Desk",
    "RBI Policy Specialist",
    86.5,
    "verified",
    "hold",
    "Headline CPI volatility from vegetable prices keeps the MPC cautious; superforecasters favor a stance shift before an actual 25 bps cut.",
    24,
    now - 5400_000,
  );

  // Seed reaction chips
  const marketIds = [
    "up-election-2027",
    "ipl-t20-chase-tonight",
    "rbi-repo-rate-dec",
    "nifty-26k-milestone",
    "btc-120k-macro",
    "ev-two-wheeler-tier2",
  ];
  for (const mId of marketIds) {
    insertReaction.run(mId, "🔥", "Momentum Shift", mId === "up-election-2027" ? 34 : 18);
    insertReaction.run(mId, "📊", "Data Drop", mId === "up-election-2027" ? 21 : 12);
    insertReaction.run(mId, "⚡", "Turning Point", mId === "ipl-t20-chase-tonight" ? 41 : 15);
  }
}

seedDatabaseIfEmpty();
seedCommunityIfEmpty();
