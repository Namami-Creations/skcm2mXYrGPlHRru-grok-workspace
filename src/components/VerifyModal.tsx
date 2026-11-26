import { ShieldCheck, Smartphone, X } from "lucide-react";
import { useState } from "react";
import type { UserProfile } from "@/lib/types";

export function VerifyModal({
  user,
  onClose,
  onVerified,
}: {
  user: UserProfile;
  onClose: () => void;
  onVerified: (updated: UserProfile) => void;
}) {
  const [phone, setPhone] = useState("");
  const [handle, setHandle] = useState(user.handle);
  const [city, setCity] = useState(user.city || "Lucknow");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestOtp() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: user.token, phone }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.reason || "Could not send OTP.");
        return;
      }
      setOtpSent(true);
      setDevOtp(data.devOtpPreview ?? "123456");
    } catch {
      setError("Network error sending OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: user.token, code, handle, city }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.reason || "Invalid OTP.");
        return;
      }
      onVerified(data.user);
      onClose();
    } catch {
      setError("Network error verifying OTP.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded border border-primary/40 bg-surface p-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-primary uppercase">
            <ShieldCheck className="size-4" />
            Anti-IT-Cell Human Verification (1.0x Weight)
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted hover:text-fg">
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          Guest ballots carry <strong className="text-fg">0.25x weight</strong> to block bot farms. Verify your Indian mobile number (zero bank/PAN KYC) to unlock{" "}
          <strong className="text-primary">1.0x full vote weight</strong> and accuracy league badges.
        </p>

        <div className="mt-4 space-y-3 font-mono text-xs">
          <div>
            <label className="block text-[10px] uppercase text-muted">Your Public Handle</label>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-primary"
              placeholder="e.g. Lucknow_Analyst"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-muted">City / Constituency</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-primary"
            >
              {[
                "Lucknow",
                "Varanasi",
                "Kanpur",
                "Prayagraj",
                "Agra",
                "Meerut",
                "Noida",
                "Gorakhpur",
                "Mumbai",
                "Bengaluru",
                "New Delhi",
                "Hyderabad",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {!otpSent ? (
            <div>
              <label className="block text-[10px] uppercase text-muted">Mobile Number (+91)</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="flex-1 rounded border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-primary"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={requestOtp}
                  className="flex items-center gap-1.5 rounded bg-primary px-3 py-2 font-bold text-bg hover:brightness-110 disabled:opacity-50"
                >
                  <Smartphone className="size-3.5" />
                  Send OTP
                </button>
              </div>
            </div>
          ) : (
            <div>
              {devOtp && (
                <p className="mb-2 rounded border border-cyan/40 bg-cyan/10 px-2.5 py-1.5 text-[11px] text-cyan">
                  Local Demo OTP: <strong>{devOtp}</strong>
                </p>
              )}
              <label className="block text-[10px] uppercase text-muted">Enter 6-Digit OTP</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="flex-1 rounded border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-primary"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={verifyOtp}
                  className="rounded bg-primary px-4 py-2 font-bold text-bg hover:brightness-110 disabled:opacity-50"
                >
                  Verify 1.0x
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-[11px] text-crimson">{error}</p>}
        </div>
      </div>
    </div>
  );
}
