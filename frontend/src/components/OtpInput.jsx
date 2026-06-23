import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

/**
 * Upwork-style OTP entry: 6 individual input boxes, paste support,
 * auto-advance, countdown-based resend.
 */
export default function OtpInput({
  label, dest, verified, value, onChange, onVerify, onResend, testId,
}) {
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(45);
  const refs = useRef([]);

  useEffect(() => {
    if (verified) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [verified]);

  const setChar = (i, ch) => {
    const arr = (value || "").padEnd(6, " ").split("");
    arr[i] = ch || " ";
    onChange(arr.join("").replace(/ /g, ""));
  };

  const handleChange = (i, raw) => {
    const ch = (raw || "").replace(/[^\d]/g, "").slice(-1);
    setChar(i, ch);
    if (ch && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const ch = (value || "")[i];
      if (ch) setChar(i, "");
      else if (i > 0) { refs.current[i - 1]?.focus(); setChar(i - 1, ""); }
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    setTimeout(() => refs.current[Math.min(text.length, 5)]?.focus(), 0);
  };

  const handleVerify = async () => {
    if ((value || "").length !== 6) return;
    setBusy(true);
    try { await onVerify(); }
    finally { setBusy(false); }
  };

  const handleResend = async () => {
    setBusy(true);
    try { await onResend(); setSeconds(45); }
    finally { setBusy(false); }
  };

  return (
    <div className="card p-5">
      <div className="flex justify-between items-start mb-1">
        <div>
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {dest && <p className="text-xs text-gray-500 mt-0.5 font-mono">{dest}</p>}
        </div>
        {verified && (
          <span className="badge badge-pro" data-testid={`${testId}-verified-badge`}>
            <CheckCircle2 size={12} /> Verified
          </span>
        )}
      </div>

      {!verified && (
        <>
          <div className="mt-4 flex gap-2 justify-between">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                data-testid={`${testId}-box-${i}`}
                inputMode="numeric"
                maxLength={1}
                value={(value || "")[i] || ""}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKey(i, e)}
                onPaste={handlePaste}
                className="w-11 h-12 text-center font-mono text-xl bg-white border border-gray-200 rounded-lg
                           focus:outline-none focus:border-[#39FF14] focus:ring-2 focus:ring-[#39FF14]/30"
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              data-testid={`${testId}-resend`}
              disabled={seconds > 0 || busy}
              onClick={handleResend}
              className="text-xs text-gray-700 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed underline-offset-2 hover:underline"
            >
              {seconds > 0 ? `Resend in 0:${String(seconds).padStart(2, "0")}` : "Resend code"}
            </button>
            <button
              type="button"
              data-testid={`${testId}-verify`}
              onClick={handleVerify}
              disabled={(value || "").length !== 6 || busy}
              className="btn-primary text-sm py-2 px-4 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {busy && <Loader2 size={14} className="animate-spin" />} Verify
            </button>
          </div>
        </>
      )}
    </div>
  );
}
