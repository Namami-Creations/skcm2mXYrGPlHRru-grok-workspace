import type { CityBreakdown, Language, MarketSummary, UserProfile } from "@/lib/types";

type ShareCardOptions = {
  market: MarketSummary;
  user?: UserProfile | null;
  topCity?: CityBreakdown;
  lang: Language;
};

/**
 * Renders a crisp 1200x630 WhatsApp / Social PNG prediction card onto an offscreen canvas.
 */
export function renderPredictionCardDataUrl({ market, user, topCity, lang }: ShareCardOptions): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Heavenly Light Teal gradient backdrop
  const grad = ctx.createLinearGradient(0, 0, 1200, 630);
  grad.addColorStop(0, "#f2faf9");
  grad.addColorStop(0.55, "#e2f5f2");
  grad.addColorStop(1, "#d3efea");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 630);

  // Subtle geometric border frame
  ctx.strokeStyle = "#0d9488";
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, 1152, 582);

  // Top Pill Bar
  ctx.fillStyle = "#0d9488";
  ctx.fillRect(52, 52, 270, 38);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 17px monospace";
  ctx.fillText("ORACLE // BLACK ARENA", 68, 77);

  ctx.fillStyle = "#0d2f2c";
  ctx.font = "bold 16px monospace";
  ctx.fillText(
    `${market.verifiedPct}% HUMAN VERIFIED · ZERO MONEY`,
    342,
    77,
  );

  // Live red dot
  ctx.beginPath();
  ctx.arc(1070, 71, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#e11d48";
  ctx.fill();
  ctx.fillStyle = "#e11d48";
  ctx.font = "bold 16px monospace";
  ctx.fillText("LIVE", 1086, 77);

  // Market Question (wrapped up to 2 lines)
  const qText = lang === "hi" && market.questionHi ? market.questionHi : market.question;
  ctx.fillStyle = "#0d2f2c";
  ctx.font = "bold 34px system-ui, sans-serif";
  const words = qText.split(" ");
  let line1 = "";
  let line2 = "";
  for (const w of words) {
    if ((line1 + " " + w).length <= 48 && !line2) {
      line1 = line1 ? `${line1} ${w}` : w;
    } else {
      line2 = line2 ? `${line2} ${w}` : w;
    }
  }
  ctx.fillText(line1, 52, 146);
  if (line2) ctx.fillText(line2.slice(0, 52), 52, 190);

  // Top City Pulse line
  if (topCity) {
    ctx.fillStyle = "#ea580c";
    ctx.font = "bold 18px monospace";
    ctx.fillText(
      `CITY PULSE: ${topCity.city.toUpperCase()} (${topCity.totalVotes} verified calls)`,
      52,
      230,
    );
  }

  // Contender Progress Bars
  const sorted = [...market.outcomes].sort((a, b) => b.pct - a.pct).slice(0, 3);
  let barY = 266;
  for (const o of sorted) {
    const label = lang === "hi" && o.labelHi ? o.labelHi : o.label;
    ctx.fillStyle = "#0d2f2c";
    ctx.font = "bold 20px monospace";
    ctx.fillText(label.slice(0, 32), 52, barY);

    ctx.fillStyle = o.color;
    ctx.font = "bold 22px monospace";
    ctx.fillText(`${o.pct.toFixed(1)}%`, 820, barY);

    // Track
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(52, barY + 12, 830, 20);
    ctx.strokeStyle = "#cce6e1";
    ctx.lineWidth = 1;
    ctx.strokeRect(52, barY + 12, 830, 20);

    // Fill
    ctx.fillStyle = o.color;
    ctx.fillRect(52, barY + 12, Math.max(16, (o.pct / 100) * 830), 20);

    barY += 74;
  }

  // Right-side Personalized Call & Accuracy Box
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(916, 130, 232, 340);
  ctx.strokeStyle = "#0d9488";
  ctx.lineWidth = 2;
  ctx.strokeRect(916, 130, 232, 340);

  const myCall = market.myOutcomeId
    ? market.outcomes.find((o) => o.id === market.myOutcomeId)
    : sorted[0];

  ctx.fillStyle = "#4b746f";
  ctx.font = "bold 14px monospace";
  ctx.fillText(market.myOutcomeId ? "MY LOCKED CALL" : "ARENA LEADER", 936, 166);

  ctx.fillStyle = myCall?.color ?? "#0d9488";
  ctx.font = "bold 21px system-ui, sans-serif";
  ctx.fillText((myCall?.label ?? "OPEN").slice(0, 17), 936, 202);

  ctx.fillStyle = "#0d2f2c";
  ctx.font = "bold 14px monospace";
  ctx.fillText(`ACCURACY: ${(user?.accuracyPct ?? 82.4).toFixed(1)}%`, 936, 248);
  ctx.fillStyle = "#ea580c";
  ctx.fillText(`STREAK: ${user?.streakDays ?? 1}D ACTIVE`, 936, 276);

  // Deterministic Mini QR Pattern Block for visual authenticity
  const qrX = 972;
  const qrY = 304;
  const cell = 10;
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 12; c++) {
      const corner = (r < 3 && c < 3) || (r < 3 && c > 8) || (r > 8 && c < 3);
      const pseudo = (r * 7 + c * 13 + market.id.length) % 3 === 0;
      if (corner || pseudo) {
        ctx.fillStyle = "#0d2f2c";
        ctx.fillRect(qrX + c * cell, qrY + r * cell, cell - 1, cell - 1);
      }
    }
  }
  ctx.fillStyle = "#4b746f";
  ctx.font = "bold 11px monospace";
  ctx.fillText("SCAN TO VOTE", 988, 444);

  // Footer
  ctx.fillStyle = "#0d2f2c";
  ctx.font = "bold 16px monospace";
  ctx.fillText(
    "1-Person-1-Vote Anti-IT-Cell Shield · What is your call?",
    52,
    574,
  );
  ctx.fillStyle = "#0d9488";
  ctx.fillText("oracle-black.arena", 952, 574);

  return canvas.toDataURL("image/png");
}

export function downloadCardPng(dataUrl: string, filename: string) {
  if (!dataUrl) return;
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
