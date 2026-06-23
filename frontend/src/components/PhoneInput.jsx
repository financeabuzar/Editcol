import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import { COUNTRIES } from "@/constants/countries";

export default function PhoneInput({ country, setCountry, phone, setPhone, testId = "phone" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = useMemo(() => {
    if (!q) return COUNTRIES;
    const k = q.toLowerCase();
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(k) || c.dial.includes(k) || c.iso.toLowerCase().includes(k));
  }, [q]);

  const sanitize = (v) => v.replace(/[^\d]/g, "").slice(0, 14);

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex">
        <button type="button" data-testid={`${testId}-country`} onClick={() => setOpen(!open)}
          className="flex items-center gap-2 bg-white border border-r-0 border-gray-200 rounded-l-xl px-3 py-3 text-sm hover:bg-gray-50">
          <span className="text-lg leading-none">{country.flag}</span>
          <span className="font-mono text-gray-700">{country.dial}</span>
          <ChevronDown size={14} className="text-gray-400" />
        </button>
        <input
          data-testid={`${testId}-number`}
          inputMode="numeric"
          className="input rounded-l-none flex-1"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(sanitize(e.target.value))}
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              className="input pl-9 py-2 text-sm"
              placeholder="Search country…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              data-testid={`${testId}-country-search`}
            />
          </div>
          <div className="max-h-64 overflow-y-auto scroll-area">
            {filtered.map((c) => (
              <button
                type="button"
                key={c.iso}
                data-testid={`${testId}-option-${c.iso}`}
                onClick={() => { setCountry(c); setOpen(false); setQ(""); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
              >
                <span className="text-lg">{c.flag}</span>
                <span className="text-gray-900 flex-1">{c.name}</span>
                <span className="font-mono text-gray-500 text-xs">{c.dial}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="p-4 text-sm text-gray-500 text-center">No country found</p>}
          </div>
        </div>
      )}
    </div>
  );
}
