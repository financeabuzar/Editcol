import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_ID = "google-identity-services";

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function GoogleAuthButton({ onCredential, text = "continue_with", disabled = false }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || disabled) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !ref.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => credential && onCredential(credential),
        });
        ref.current.innerHTML = "";
        window.google.accounts.id.renderButton(ref.current, {
          theme: "outline",
          size: "large",
          width: ref.current.offsetWidth || 320,
          text,
          shape: "pill",
        });
        setReady(true);
      })
      .catch(() => setReady(false));

    return () => { cancelled = true; };
  }, [clientId, disabled, onCredential, text]);

  if (!clientId) {
    return (
      <div className="text-xs text-gray-500 text-center">
        Add REACT_APP_GOOGLE_CLIENT_ID to enable Google sign-in.
      </div>
    );
  }

  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      <div ref={ref} className="w-full min-h-[44px]" />
      {!ready && <div className="h-11 rounded-full border border-gray-200 bg-gray-50" />}
    </div>
  );
}
