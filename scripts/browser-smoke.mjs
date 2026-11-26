import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const errors = [];

  // 1. Desktop 1440x900 Full Interactive Flow
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktopCtx.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

  const res = await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle", timeout: 20000 });
  if (!res || res.status() !== 200) throw new Error(`Expected 200, got ${res?.status()}`);

  const ssDir = path.resolve(process.cwd(), "screenshots");
  await fs.mkdir(ssDir, { recursive: true });

  // Wait for UP Election 2027 + AI Battleground Hero Image + Face-off Contenders
  await page.locator("h1:has-text('Uttar Pradesh Assembly Election 2027')").waitFor({ timeout: 8000 });
  await page.locator("text=CM Yogi Adityanath").first().waitFor({ timeout: 5000 });
  await page.locator("text=Akhilesh Yadav").first().waitFor({ timeout: 5000 });
  await page.locator("text=Rahul Gandhi").first().waitFor({ timeout: 5000 });
  await page.locator("img[src*='/images/battle-up-election.jpg']").first().waitFor({ timeout: 5000 });
  await page.screenshot({ path: path.join(ssDir, "01_arena_desktop.png") });

  // Verify Bitcoin poll shows dedicated Bitcoin artwork
  await page.locator("aside button:has-text('Bitcoin')").first().click();
  await page.locator("img[src*='/images/battle-bitcoin.jpg']").first().waitFor({ timeout: 5000 });
  await page.screenshot({ path: path.join(ssDir, "09_bitcoin_poll_image.png") });
  await page.locator("aside button:has-text('Uttar Pradesh')").first().click();
  await page.locator("h1:has-text('Uttar Pradesh Assembly Election 2027')").waitFor({ timeout: 5000 });

  // Test EN <-> Hindi toggle
  await page.locator("button:has-text('EN / हिं')").click();
  await page.locator("h1:has-text('उत्तर प्रदेश विधानसभा चुनाव 2027')").waitFor({ timeout: 5000 });
  await page.locator("button:has-text('हिन्दी')").click();

  // Test 1-Tap Vote with SHA-256 PoW on Live Power Tile
  await page.locator("button:has-text('LEADING')").first().click();
  await page.locator("text=Locked with PoW").first().waitFor({ timeout: 8000 });
  await page.locator("button:has-text('SIMULATE LIVE CROWD')").click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ssDir, "02_after_1tap_vote.png") });

  // Test Pulse 5s & Reaction Chip
  await page.locator("button:has-text('Pulse 5s')").click();
  await page.locator("button:has-text('Momentum Shift')").click();

  // Test City Pulse tab + Interactive India Map & UP Constituency Explorer
  await page.locator("button:has-text('City Pulse')").click();
  await page.locator("text=Varanasi").first().waitFor({ timeout: 5000 });
  await page.locator("text=Interactive India Pulse Map").first().waitFor({ timeout: 5000 });
  await page.locator("text=5-Zone UP Constituency Radar").first().waitFor({ timeout: 5000 });
  await page.locator("text=Varanasi North").first().waitFor({ timeout: 5000 });
  await page.screenshot({ path: path.join(ssDir, "03_city_pulse.png") });

  // Test Debate & League tab + post rationale
  await page.locator("button:has-text('Debate & League')").click();
  await page.locator("text=Seasonal Reputation League").first().waitFor({ timeout: 5000 });
  await page.locator("textarea").fill("Booth-level ground data shows tight contest in central UP.");
  await page.locator("button:has-text('Post Rationale')").click();
  await page.locator("text=Booth-level ground data shows tight contest").first().waitFor({ timeout: 5000 });

  // Test Anon Wall & Groups tab + Calibrated Sort + Burn Room + Pin Group Pulse
  await page.locator("button:has-text('Anon Wall & Groups')").click();
  await page.locator("h3:has-text('Single Anonymous Public Wall')").waitFor({ timeout: 5000 });
  const uniqueMsg = `Quiet rural swing ${Date.now()} — glad we speak without usernames.`;
  await page.locator("textarea[placeholder*='Share your honest thought']").fill(uniqueMsg);
  await page.locator("button:has-text('Post Anonymously')").click();
  await page.locator(`text=${uniqueMsg}`).first().waitFor({ timeout: 5000 });

  // Toggle Top Calibrated Voices sorting
  await page.locator("button:has-text('Sort: Latest')").click();
  await page.locator("button:has-text('Top Calibrated Voices')").waitFor({ timeout: 4000 });

  // Create 24h Burn Room + Pin Group Pulse to Wall
  await page.locator("button:has-text('New Group')").click();
  await page.locator("input[placeholder*='Group name']").fill("Kashi 24h Burn Room");
  await page.locator("label:has-text('24h Burn Room') input").check();
  await page.locator("input[placeholder*='What will your group track']").fill("Local Varanasi district pulse");
  await page.locator("button:has-text('Launch Group Room')").click();
  await page.locator("text=Group live! You are masked as Mask #").first().waitFor({ timeout: 5000 });
  await page.locator("input[placeholder*='Chat anonymously as Mask']").fill("Tracking urban vs rural turnout delta now.");
  await page.locator("input[placeholder*='Chat anonymously as Mask']").press("Enter");
  await page.locator("text=Tracking urban vs rural turnout delta now.").first().waitFor({ timeout: 5000 });

  await page.locator("button:has-text('Pin to Wall')").click();
  await page.locator("input[placeholder*='1-sentence group summary']").fill("Kashi observers note strong late-evening rural turnout.");
  await page.locator("button:has-text('Pin')").last().click();
  await page.locator("text=Kashi observers note strong late-evening rural turnout.").first().waitFor({ timeout: 5000 });
  await page.locator("button:has-text('Rank')").click();
  await page.locator("text=Anonymous Friends League").first().waitFor({ timeout: 5000 });
  await page.getByRole("button", { name: "Chat", exact: true }).click();
  await page.screenshot({ path: path.join(ssDir, "08_community_wall_groups.png") });

  // Test News & Fact-Check tab + Exit Poll Comparator
  await page.locator("button:has-text('News & Fact-Check')").click();
  await page.locator("text=CROWD CONSENSUS VS. OFFICIAL ORACLE").first().waitFor({ timeout: 8000 });
  await page.locator("text=Exit Poll & Pollster Accuracy Comparator").first().waitFor({ timeout: 5000 });
  await page.screenshot({ path: path.join(ssDir, "04_news_fact_check.png") });

  // Test Verified Independent Methodology Modal
  await page.locator("button:has-text('Verified Independent')").click();
  await page.locator("text=ECI Section 126 Blackout Compliance").first().waitFor({ timeout: 5000 });
  await page.locator("div.fixed button").first().click();

  // Test Pro Terminal Mode + Ask India Studio
  await page.locator("button:has-text('Pro Terminal')").click();
  await page.locator("h3:has-text('Sponsored Pulse Studio')").waitFor({ timeout: 5000 });
  await page.screenshot({ path: path.join(ssDir, "05_pro_terminal.png") });

  // Test Share Battleground Modal (1200x630 PNG Card + Journalist Embed)
  await page.locator("button:has-text('Share Card')").click();
  await page.locator("text=Battleground Share Card").first().waitFor({ timeout: 5000 });
  await page.locator("img[alt='Oracle Black Prediction Card Preview']").waitFor({ timeout: 5000 });
  await page.locator("text=Journalist Embed Widget").first().waitFor({ timeout: 5000 });
  await page.screenshot({ path: path.join(ssDir, "06_share_card.png") });
  await page.locator("div.fixed button").first().click();

  // Test OTP Verification Modal
  await page.locator("button:has-text('Guest 0.25x')").click();
  await page.locator("input[placeholder='9876543210']").fill("9876543210");
  await page.locator("button:has-text('Send OTP')").click();
  await page.locator("text=Local Demo OTP:").first().waitFor({ timeout: 5000 });
  await page.locator("input[placeholder='123456']").fill("123456");
  await page.locator("button:has-text('Verify 1.0x')").click();
  await page.locator("button:has-text('Verified 1.0x')").first().waitFor({ timeout: 5000 });

  const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

  // Test Journalist Embed Widget Route
  await page.goto("http://127.0.0.1:8080/embed/up-election-2027", { waitUntil: "networkidle", timeout: 15000 });
  await page.locator("text=ORACLE // BLACK · LIVE CONSENSUS EMBED").first().waitFor({ timeout: 5000 });
  await page.locator("text=Cast 1-Tap Vote").first().waitFor({ timeout: 5000 });

  // 2. Mobile 390x844 Check
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mPage = await mobileCtx.newPage();
  mPage.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`mobile console.error: ${msg.text()}`);
  });
  mPage.on("pageerror", (err) => errors.push(`mobile pageerror: ${err.message}`));

  await mPage.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle", timeout: 20000 });
  await mPage.locator("text=1-Tap Call").first().waitFor({ timeout: 8000 });
  await mPage.screenshot({ path: path.join(ssDir, "07_mobile_arena.png") });

  const mobileOverflow = await mPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

  await browser.close();

  console.log(
    JSON.stringify(
      {
        status: "PASS",
        desktopOverflow,
        mobileOverflow,
        errors,
      },
      null,
      2,
    ),
  );

  if (desktopOverflow || mobileOverflow || errors.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
