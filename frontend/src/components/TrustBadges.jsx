import { CheckCircle2, Award, Star, Crown } from "lucide-react";

const BADGES = {
  verified: { label: "Verified Editor", Icon: CheckCircle2, cls: "badge-verified" },
  pro:      { label: "Pro Editor",      Icon: Award,         cls: "badge-pro" },
  top_rated:{ label: "Top Rated",       Icon: Star,          cls: "badge-top" },
  elite:    { label: "Elite Editor",    Icon: Crown,         cls: "badge-elite" },
};

export default function TrustBadges({ badges = [], size = "sm" }) {
  if (!badges?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => {
        const cfg = BADGES[b]; if (!cfg) return null;
        const Icon = cfg.Icon;
        return (
          <span key={b} className={`badge ${cfg.cls}`} data-testid={`badge-${b}`}>
            <Icon size={12} />
            <span>{cfg.label}</span>
          </span>
        );
      })}
    </div>
  );
}

export { BADGES };
