import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import OtpInput from "@/components/OtpInput";
import { ArrowLeft, CheckCircle2, Loader2, Mail, Phone } from "lucide-react";

export default function VerifyAccount() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [activeType, setActiveType] = useState(user?.phone_verified ? "email" : "phone");
  const [codes, setCodes] = useState({ email: "", phone: "" });
  const [sent, setSent] = useState({ email: false, phone: false });
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  const items = useMemo(() => ([
    {
      type: "email",
      label: "Email verification",
      dest: user?.email,
      verified: !!user?.email_verified,
      Icon: Mail,
    },
    {
      type: "phone",
      label: "Phone verification",
      dest: user?.phone,
      verified: !!user?.phone_verified,
      Icon: Phone,
    },
  ]), [user]);

  if (!user) return null;

  const updateCode = (type, value) => {
    setCodes((current) => ({ ...current, [type]: value }));
  };

  const sendCode = async (type) => {
    setBusy(type);
    setErr("");
    setNote("");
    try {
      await api.post("/auth/resend-otp", { email: user.email, type });
      setSent((current) => ({ ...current, [type]: true }));
      setActiveType(type);
      setNote(`Code sent to your ${type}.`);
    } catch (e) {
      setErr(formatApiError(e));
    } finally {
      setBusy("");
    }
  };

  const verifyCode = async (type) => {
    setErr("");
    setNote("");
    try {
      await api.post("/auth/verify-otp", { email: user.email, otp: codes[type], type });
      await refresh();
      setCodes((current) => ({ ...current, [type]: "" }));
      setNote(`${type === "phone" ? "Phone" : "Email"} verified.`);
      if ((type === "phone" && user.email_verified) || (type === "email" && user.phone_verified)) {
        nav("/dashboard", { replace: true });
      }
    } catch (e) {
      setErr(formatApiError(e));
    }
  };

  const needsVerification = items.some((item) => !item.verified);

  return (
    <div className="fade-in max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
        <ArrowLeft size={16} /> Back to dashboard
      </Link>

      <div className="mt-6 mb-8">
        <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Account security</p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900">Verify your account</h1>
        <p className="mt-2 text-sm text-gray-500">Confirm your contact details to unlock every EditCol feature.</p>
      </div>

      {err && <p className="card p-4 mb-4 border-red-200 bg-red-50 text-sm text-red-700">{err}</p>}
      {note && <p className="card p-4 mb-4 border-lime-200 bg-lime-50 text-sm text-lime-900">{note}</p>}

      {!needsVerification ? (
        <div className="card p-8 text-center">
          <CheckCircle2 className="mx-auto text-[#39FF14]" size={36} />
          <h2 className="mt-3 font-heading text-2xl font-semibold text-gray-900">You're verified</h2>
          <p className="mt-2 text-sm text-gray-500">Your email and phone are already confirmed.</p>
          <Link to="/dashboard" className="btn-primary inline-flex mt-6">Return to dashboard</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(({ type, label, dest, verified, Icon }) => (
            <section key={type} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-heading text-xl font-semibold text-gray-900">{label}</h2>
                    <p className="text-sm text-gray-500 break-all">{dest || `No ${type} saved on this account`}</p>
                  </div>
                </div>

                {verified ? (
                  <span className="badge badge-pro w-fit"><CheckCircle2 size={12} /> Verified</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => sendCode(type)}
                    disabled={busy === type || !dest}
                    className="btn-primary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {busy === type && <Loader2 size={16} className="animate-spin" />}
                    {sent[type] ? "Send new code" : "Send code"}
                  </button>
                )}
              </div>

              {!verified && sent[type] && activeType === type && (
                <div className="mt-5">
                  <OtpInput
                    label={`Enter ${type} code`}
                    dest={dest}
                    verified={verified}
                    value={codes[type]}
                    onChange={(value) => updateCode(type, value)}
                    onVerify={() => verifyCode(type)}
                    onResend={() => sendCode(type)}
                    testId={`${type}-verify`}
                  />
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
