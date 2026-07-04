import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Home, RefreshCw, SearchX, ShieldAlert } from "lucide-react";

const ERROR_COPY = {
  404: {
    Icon: SearchX,
    eyebrow: "Page not found",
    title: "This page does not exist.",
    message:
      "The link may be broken, the page may have moved, or the address may have been typed incorrectly.",
    primaryLabel: "Go home",
    primaryTo: "/",
  },
  500: {
    Icon: ShieldAlert,
    eyebrow: "Something went wrong",
    title: "We hit an unexpected error.",
    message:
      "The app could not finish loading this screen. Try again, or head back to a safe page.",
    primaryLabel: "Reload page",
  },
  403: {
    Icon: AlertTriangle,
    eyebrow: "Access denied",
    title: "You do not have access to this page.",
    message:
      "Your account does not have permission to view this area. Go back or return to your dashboard.",
    primaryLabel: "Go to dashboard",
    primaryTo: "/dashboard",
  },
};

export default function ErrorPage({ code = 404, title, message, showBack = true }) {
  const navigate = useNavigate();
  const details = ERROR_COPY[code] || ERROR_COPY[404];
  const Icon = details.Icon;
  const primaryAction = details.primaryTo
    ? { as: Link, to: details.primaryTo }
    : { as: "button", onClick: () => window.location.reload() };
  const Primary = primaryAction.as;

  return (
    <section className="min-h-[70vh] flex items-center">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
        <div className="max-w-2xl">
          <div className="w-14 h-14 rounded-2xl bg-ink text-white flex items-center justify-center">
            <Icon size={24} className="text-[#39FF14]" />
          </div>
          <p className="mt-6 text-xs font-bold tracking-wider uppercase text-gray-500">
            {code} error · {details.eyebrow}
          </p>
          <h1 className="font-heading text-4xl sm:text-6xl font-bold text-gray-900 mt-3 leading-tight">
            {title || details.title}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-gray-600 leading-relaxed">
            {message || details.message}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Primary
              {...(primaryAction.to ? { to: primaryAction.to } : { onClick: primaryAction.onClick, type: "button" })}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              {details.primaryTo ? <Home size={16} /> : <RefreshCw size={16} />}
              {details.primaryLabel}
            </Primary>
            {showBack && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-outline inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Go back
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
