import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import OtpInput from "@/components/OtpInput";
import PhoneInput from "@/components/PhoneInput";
import { COUNTRIES } from "@/constants/countries";
import { ArrowLeft, CheckCircle2, Loader2, Mail, Phone, Pencil, X } from "lucide-react";

const DEFAULT_COUNTRY = COUNTRIES.find((country) => country.iso === "IN") || COUNTRIES[0];

function splitPhone(value) {
  const phone = value || "";
  const country = [...COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((item) => phone.startsWith(item.dial)) || DEFAULT_COUNTRY;

  return {
    country,
    number: phone.startsWith(country.dial) ? phone.slice(country.dial.length).replace(/\D/g, "") : phone.replace(/\D/g, ""),
  };
}

export default function VerifyAccount() {
  const { user, refresh, setUser } = useAuth();
  const nav = useNavigate();
  const [activeType, setActiveType] = useState(user?.phone_verified ? "email" : "phone");
  const [codes, setCodes] = useState({ email: "", phone: "" });
  const [sent, setSent] = useState({ email: false, phone: false });
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const initialPhone = useMemo(() => splitPhone(user?.phone), [user?.phone]);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState(initialPhone.country);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone.number);

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

  const startPhoneEdit = () => {
    const current = splitPhone(user?.phone);
    setPhoneCountry(current.country);
    setPhoneNumber(current.number);
    setEditingPhone(true);
    setErr("");
    setNote("");
  };

  const cancelPhoneEdit = () => {
    const current = splitPhone(user?.phone);
    setPhoneCountry(current.country);
    setPhoneNumber(current.number);
    setEditingPhone(false);
  };

  const savePhone = async () => {
    setBusy("phone-save");
    setErr("");
    setNote("");
    try {
      const nextPhone = `${phoneCountry.dial}${phoneNumber}`;
      const { data } = await api.put("/auth/phone", { phone: nextPhone });
      setUser(data);
      setSent((current) => ({ ...current, phone: false }));
      setCodes((current) => ({ ...current, phone: "" }));
      setActiveType("phone");
      setEditingPhone(false);
      setNote("Phone number updated. Send a new code to verify it.");
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
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back to dashboard
      </Link>

      <div className="mt-6 mb-8">
        <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Account security</p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">Verify your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Confirm your contact details to unlock every EditCol feature.</p>
      </div>

      {err && <p className="card p-4 mb-4 border-red-500/40 bg-red-500/10 text-sm text-red-200">{err}</p>}
      {note && <p className="card p-4 mb-4 border-lime-400/40 bg-lime-400/10 text-sm text-lime-100">{note}</p>}

      {!needsVerification ? (
        <div className="card p-8 text-center">
          <CheckCircle2 className="mx-auto text-cyan-400" size={36} />
          <h2 className="mt-3 font-heading text-2xl font-semibold text-foreground">You're verified</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your email and phone are already confirmed.</p>
          <Link to="/dashboard" className="btn-primary inline-flex mt-6">Return to dashboard</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(({ type, label, dest, verified, Icon }) => (
            <section key={type} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-heading text-xl font-semibold text-foreground">{label}</h2>
                    <p className="text-sm text-muted-foreground break-all">{dest || `No ${type} saved on this account`}</p>
                  </div>
                </div>

                {verified ? (
                  <span className="badge badge-pro w-fit"><CheckCircle2 size={12} /> Verified</span>
                ) : (
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    {type === "phone" && (
                      <button
                        type="button"
                        onClick={startPhoneEdit}
                        className="btn-outline inline-flex items-center justify-center gap-2 text-sm"
                      >
                        <Pencil size={15} /> Edit phone
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => sendCode(type)}
                      disabled={busy === type || !dest || editingPhone}
                      className="btn-primary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      {busy === type && <Loader2 size={16} className="animate-spin" />}
                      {sent[type] ? "Send new code" : "Send code"}
                    </button>
                  </div>
                )}
              </div>

              {type === "phone" && editingPhone && (
                <div className="mt-5 border-t border-white/10 pt-5">
                  <label className="input-label">New phone number</label>
                  <PhoneInput
                    country={phoneCountry}
                    setCountry={setPhoneCountry}
                    phone={phoneNumber}
                    setPhone={setPhoneNumber}
                    testId="verify-phone-edit"
                  />
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={cancelPhoneEdit}
                      className="btn-outline inline-flex items-center justify-center gap-2 text-sm"
                    >
                      <X size={15} /> Cancel
                    </button>
                    <button
                      type="button"
                      onClick={savePhone}
                      disabled={busy === "phone-save" || phoneNumber.length < 7}
                      className="btn-primary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      {busy === "phone-save" && <Loader2 size={16} className="animate-spin" />}
                      Save phone
                    </button>
                  </div>
                </div>
              )}

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
