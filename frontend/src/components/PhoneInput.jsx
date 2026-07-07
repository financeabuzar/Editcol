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
          aria-expanded={open} aria-haspopup="listbox"
          className="flex items-center gap-2 bg-background border border-r-0 border-border rounded-l-xl px-3 py-3 text-sm hover:bg-secondary transition-colors text-foreground">
          <span className="text-lg leading-none">{country.flag}</span>
          <span className="font-mono text-muted-foreground">{country.dial}</span>
          <ChevronDown size={14} className="text-muted-foreground" />
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
        <div className="absolute left-0 right-0 z-20 mt-2 w-full min-w-0 sm:right-auto sm:w-80 bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-border relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary text-left transition-colors"
              >
                <span className="text-lg">{c.flag}</span>
                <span className="text-foreground flex-1 min-w-0 truncate">{c.name}</span>
                <span className="font-mono text-muted-foreground text-xs">{c.dial}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">No country found</p>}
          </div>
        </div>
      )}
    </div>
  );
}
