import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, MapPin, Radar } from "lucide-react";
import type { CityBreakdown, ConstituencySeat, Language, Outcome, UPZone } from "@/lib/types";

const ZONES: UPZone[] = ["Purvanchal", "Awadh", "West UP", "Bundelkhand", "Rohilkhand"];

const INDIA_HUBS: Array<{
  id: string;
  label: string;
  city: string;
  x: number;
  y: number;
  r: number;
}> = [
  { id: "dl", label: "NCR", city: "New Delhi", x: 108, y: 82, r: 10 },
  { id: "up", label: "UP", city: "Lucknow", x: 148, y: 98, r: 16 },
  { id: "vns", label: "Kashi", city: "Varanasi", x: 174, y: 112, r: 11 },
  { id: "gj", label: "GJ", city: "Ahmedabad", x: 76, y: 132, r: 10 },
  { id: "wb", label: "WB", city: "Kolkata", x: 214, y: 136, r: 11 },
  { id: "mh", label: "MH", city: "Mumbai", x: 86, y: 170, r: 12 },
  { id: "ts", label: "TS", city: "Hyderabad", x: 132, y: 186, r: 10 },
  { id: "ka", label: "KA", city: "Bengaluru", x: 114, y: 226, r: 11 },
  { id: "tn", label: "TN", city: "Chennai", x: 138, y: 236, r: 10 },
];

function ZoneSpiderRadar({
  seats,
  outcomes,
}: {
  seats: ConstituencySeat[];
  outcomes: Outcome[];
}) {
  const top2 = [...outcomes].sort((a, b) => b.pct - a.pct).slice(0, 2);
  const aId = top2[0]?.id ?? "bjp";
  const bId = top2[1]?.id ?? "sp";
  const aColor = top2[0]?.color ?? "#f97316";
  const bColor = top2[1]?.color ?? "#e11d48";

  const cx = 135;
  const cy = 115;
  const maxR = 72;

  const zoneAverages = useMemo(() => {
    return ZONES.map((zone) => {
      const zSeats = seats.filter((s) => s.zone === zone);
      if (zSeats.length === 0) return { zone, a: 40, b: 35 };
      const avgA = zSeats.reduce((sum, s) => sum + (s.shares[aId] ?? 0), 0) / zSeats.length;
      const avgB = zSeats.reduce((sum, s) => sum + (s.shares[bId] ?? 0), 0) / zSeats.length;
      return { zone, a: avgA, b: avgB };
    });
  }, [seats, aId, bId]);

  const pointAt = (idx: number, pct: number) => {
    const angle = (-90 + idx * (360 / ZONES.length)) * (Math.PI / 180);
    const r = (Math.min(70, Math.max(10, pct)) / 70) * maxR;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
  };

  const polyA = zoneAverages.map((z, i) => pointAt(i, z.a).join(",")).join(" ");
  const polyB = zoneAverages.map((z, i) => pointAt(i, z.b).join(",")).join(" ");

  return (
    <div className="rounded border border-line/80 bg-bg/80 p-3">
      <div className="flex items-center justify-between font-mono text-[10px]">
        <span className="flex items-center gap-1.5 font-bold uppercase text-fg">
          <Radar className="size-3.5 text-primary" />
          5-Zone UP Constituency Radar
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1" style={{ color: aColor }}>
            <span className="size-2 rounded-full" style={{ backgroundColor: aColor }} />
            {aId.toUpperCase()}
          </span>
          <span className="flex items-center gap-1" style={{ color: bColor }}>
            <span className="size-2 rounded-full" style={{ backgroundColor: bColor }} />
            {bId.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-center">
        <svg viewBox="0 0 270 230" className="h-52 w-full max-w-[270px]">
          {[22, 46, 72].map((ring) => (
            <polygon
              key={ring}
              points={ZONES.map((_, i) => {
                const ang = (-90 + i * 72) * (Math.PI / 180);
                return `${cx + ring * Math.cos(ang)},${cy + ring * Math.sin(ang)}`;
              }).join(" ")}
              fill="none"
              stroke="#cce6e1"
              strokeWidth="1"
            />
          ))}

          {ZONES.map((z, i) => {
            const ang = (-90 + i * 72) * (Math.PI / 180);
            const lx = cx + (maxR + 18) * Math.cos(ang);
            const ly = cy + (maxR + 14) * Math.sin(ang);
            return (
              <g key={z}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx + maxR * Math.cos(ang)}
                  y2={cy + maxR * Math.sin(ang)}
                  stroke="#cce6e1"
                  strokeWidth="1"
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  fill="#0d2f2c"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {z}
                </text>
              </g>
            );
          })}

          <polygon points={polyA} fill={aColor} fillOpacity="0.24" stroke={aColor} strokeWidth="2" />
          <polygon points={polyB} fill={bColor} fillOpacity="0.22" stroke={bColor} strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

export function IndiaConstituencyMap({
  marketId,
  token,
  cities,
  outcomes,
  selectedCity,
  onSelectCity,
  lang,
}: {
  marketId: string;
  token: string;
  cities: CityBreakdown[];
  outcomes: Outcome[];
  selectedCity?: string;
  onSelectCity: (city: string) => void;
  lang: Language;
}) {
  const [seats, setSeats] = useState<ConstituencySeat[]>([]);
  const [zoneFilter, setZoneFilter] = useState<"all" | UPZone>("all");
  const [seatQuery, setSeatQuery] = useState("");
  const [votingSeatId, setVotingSeatId] = useState<string | null>(null);

  const loadSeats = useCallback(async () => {
    const res = await fetch(
      `/api/constituencies?marketId=${encodeURIComponent("up-election-2027")}&token=${encodeURIComponent(token)}`,
    );
    if (res.ok) {
      const data = await res.json();
      setSeats(data.seats ?? []);
    }
  }, [token]);

  useEffect(() => {
    void loadSeats();
  }, [loadSeats, marketId]);

  async function voteSeat(constituencyId: string, outcomeId: string) {
    setVotingSeatId(constituencyId);
    try {
      const res = await fetch("/api/constituencies/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          constituencyId,
          marketId: "up-election-2027",
          outcomeId,
          token,
        }),
      });
      if (res.ok) await loadSeats();
    } finally {
      setVotingSeatId(null);
    }
  }

  const filteredSeats = useMemo(() => {
    const q = seatQuery.trim().toLowerCase();
    return seats.filter((s) => {
      if (zoneFilter !== "all" && s.zone !== zoneFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q) ||
        String(s.seatNo).includes(q)
      );
    });
  }, [seats, zoneFilter, seatQuery]);

  const upCandidates = [
    { id: "bjp", label: "BJP", color: "#f97316" },
    { id: "sp", label: "SP", color: "#e11d48" },
    { id: "inc", label: "INC", color: "#0d9488" },
    { id: "bsp", label: "BSP", color: "#0284c7" },
  ];

  return (
    <div className="mt-4 space-y-3 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-fg">
          <MapPin className="size-4 text-primary" />
          <span>
            {lang === "hi"
              ? "इंटरैक्टिव भारत मानचित्र व यूपी 403 सीट एक्सप्लोरर"
              : "Interactive India Pulse Map & UP 403-Seat Explorer"}
          </span>
        </div>
        <span className="rounded bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
          {seats.length} KEY SEATS LIVE
        </span>
      </div>

      {/* Top Row: Stylized India Interactive Pulse Map + 5-Zone UP Spider Radar */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Stylized India Map */}
        <div className="rounded border border-line/80 bg-bg/80 p-3">
          <div className="flex items-center justify-between font-mono text-[10px] text-muted">
            <span className="font-bold uppercase text-fg">India Live Pulse Nodes</span>
            <span>Click any node to inspect city</span>
          </div>
          <div className="mt-1 flex items-center justify-center">
            <svg viewBox="0 0 280 280" className="h-52 w-full max-w-[270px]">
              {/* Simplified geometric India silhouette */}
              <path
                d="M115,24 L145,28 L158,52 L144,74 L175,88 L208,104 L245,98 L254,116 L225,135 L208,158 L168,186 L146,232 L126,262 L106,238 L86,184 L62,148 L52,126 L78,106 L88,78 L104,50 Z"
                fill="#dff3f0"
                stroke="#0d9488"
                strokeWidth="1.5"
              />
              {INDIA_HUBS.map((hub) => {
                const match = cities.find((c) => c.city === hub.city);
                const dom = outcomes.find((o) => o.id === match?.dominantOutcomeId);
                const color = dom?.color ?? "#0d9488";
                const isActive = selectedCity === hub.city;
                return (
                  <g
                    key={hub.id}
                    className="cursor-pointer"
                    onClick={() => onSelectCity(hub.city)}
                  >
                    <circle
                      cx={hub.x}
                      cy={hub.y}
                      r={isActive ? hub.r + 3 : hub.r}
                      fill={color}
                      fillOpacity={isActive ? 0.9 : 0.72}
                      stroke="#ffffff"
                      strokeWidth={isActive ? 2.5 : 1.5}
                    />
                    <text
                      x={hub.x}
                      y={hub.y + 3}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="7.5"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {hub.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 5-Zone UP Spider Radar Chart */}
        <ZoneSpiderRadar seats={seats} outcomes={outcomes} />
      </div>

      {/* UP Constituency Micro-Polls */}
      <div className="rounded border border-line/80 bg-bg/70 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 font-mono text-[10px]">
            {(["all", ...ZONES] as const).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoneFilter(z)}
                className={`rounded border px-2 py-1 ${
                  zoneFilter === z
                    ? "border-primary bg-primary text-white font-bold"
                    : "border-line bg-surface text-muted hover:text-fg"
                }`}
              >
                {z === "all" ? "All Zones" : z}
              </button>
            ))}
          </div>

          <input
            value={seatQuery}
            onChange={(e) => setSeatQuery(e.target.value)}
            placeholder="Search seat (Varanasi, Amethi, Noida...)"
            className="w-full rounded border border-line bg-surface px-2.5 py-1 font-mono text-[11px] text-fg outline-none focus:border-primary sm:w-64"
          />
        </div>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSeats.map((s) => {
            const leadMeta = upCandidates.find((c) => c.id === s.leaderId) ?? upCandidates[0];
            return (
              <div
                key={s.id}
                className="rounded border border-line bg-surface p-2.5 font-mono text-xs"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="rounded bg-bg px-1.5 py-0.5 font-bold text-muted">
                    #{s.seatNo} · {s.zone}
                  </span>
                  <span className="font-bold" style={{ color: leadMeta.color }}>
                    {leadMeta.label} {(s.shares[s.leaderId] ?? 0).toFixed(0)}%
                  </span>
                </div>
                <p className="mt-1 font-bold text-fg">{s.name}</p>
                <p className="text-[10px] text-muted">{s.district} · {s.totalVotes} seat calls</p>

                <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-bg">
                  {upCandidates.map((c) => (
                    <div
                      key={c.id}
                      style={{ width: `${s.shares[c.id] ?? 0}%`, backgroundColor: c.color }}
                      className="h-full"
                    />
                  ))}
                </div>

                {/* 1-Tap Seat Micro-Vote */}
                <div className="mt-2 grid grid-cols-4 gap-1">
                  {upCandidates.map((c) => {
                    const isMine = s.myVoteId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={votingSeatId === s.id}
                        onClick={() => void voteSeat(s.id, c.id)}
                        className={`flex items-center justify-center gap-0.5 rounded border py-0.5 text-[9px] font-bold transition-colors ${
                          isMine
                            ? "border-primary bg-primary text-white"
                            : "border-line bg-bg text-fg hover:border-primary/60"
                        }`}
                      >
                        {isMine && <Check className="size-2.5" />}
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
