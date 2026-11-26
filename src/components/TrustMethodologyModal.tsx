import { CheckCircle2, Lock, Scale, ShieldCheck, Sparkles, X } from "lucide-react";

export function TrustMethodologyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-primary/40 bg-surface p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-primary uppercase">
            <ShieldCheck className="size-4" />
            Verified Independent · Open Methodology
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted hover:bg-bg hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-3 space-y-3 text-xs leading-relaxed text-fg">
          <div className="rounded-lg border border-primary/30 bg-bg/80 p-3">
            <p className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-primary uppercase">
              <CheckCircle2 className="size-3.5" /> Zero Party Funding · Zero Gambling
            </p>
            <p className="mt-1 text-muted">
              Oracle Black Arena accepts ₹0 from any political party, candidate, or election consultancy. No real money is wagered—making it 100% compliant with India’s online gaming laws (PROGA / IT Act Sec. 69A).
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="rounded border border-line bg-bg/60 p-3">
              <p className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-fg">
                <Lock className="size-3.5 text-primary" /> SHA-256 Anti-IT-Cell PoW
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Every ballot and anonymous wall post must solve a cryptographic SHA-256 nonce challenge plus a 60s duplicate slogan detector to defeat bot farms.
              </p>
            </div>

            <div className="rounded border border-line bg-bg/60 p-3">
              <p className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-fg">
                <Sparkles className="size-3.5 text-cyan" /> Top 5% Calibration Layer
              </p>
              <p className="mt-1 text-[11px] text-muted">
                We track every forecaster’s historical accuracy (Brier score). High-accuracy voices appear as a separate ◆ marker on live bars and Wall sorting.
              </p>
            </div>
          </div>

          <div className="rounded border border-accent/30 bg-accent/5 p-3">
            <p className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-accent uppercase">
              <Scale className="size-3.5" /> ECI Section 126 Blackout Compliance
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Under Section 126 of the Representation of the People Act, live election opinion tallies automatically enter a quiet blackout window 48 hours before polling closes, while civic issue discussion stays open.
            </p>
          </div>

          <div className="rounded border border-line bg-bg/70 p-3 font-mono text-[11px]">
            <p className="font-bold text-fg uppercase">DPDP Privacy Guarantee</p>
            <p className="mt-1 text-muted">
              • Public Wall: zero usernames stored.
              <br />
              • Group Chats: cryptographic rotating room masks (Mask #10–#99) unlinkable across rooms.
              <br />
              • OTP Phone Number: salted & masked (+91-XXXXXX1234) strictly for 1-person-1-vote human weight.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
