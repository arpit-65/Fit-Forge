import cn from "clsx";

type RiskLevel = "low" | "medium" | "high";

interface RiskBadgeProps {
  score: number; // 0–100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

function getRiskLevel(score: number): RiskLevel {
  if (score < 35) return "low";
  if (score < 70) return "medium";
  return "high";
}

const levelConfig: Record<
  RiskLevel,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  low: {
    label: "Low Risk",
    color: "text-risk-low",
    bg: "bg-risk-low/10",
    border: "border-risk-low/20",
    dot: "bg-risk-low",
  },
  medium: {
    label: "Medium Risk",
    color: "text-risk-medium",
    bg: "bg-risk-medium/10",
    border: "border-risk-medium/20",
    dot: "bg-risk-medium",
  },
  high: {
    label: "High Risk",
    color: "text-risk-high",
    bg: "bg-risk-high/10",
    border: "border-risk-high/20",
    dot: "bg-risk-high",
  },
};

const sizeConfig = {
  sm: { badge: "text-xs px-2 py-0.5", dot: "h-1.5 w-1.5", score: "text-xs" },
  md: { badge: "text-sm px-3 py-1", dot: "h-2 w-2", score: "text-sm" },
  lg: { badge: "text-base px-4 py-1.5", dot: "h-2.5 w-2.5", score: "text-base" },
};

/**
 * Color-coded risk badge showing dropout risk level.
 * Green < 35, Amber 35–69, Red ≥ 70.
 */
export function RiskBadge({ score, showLabel = true, size = "md" }: RiskBadgeProps) {
  const level = getRiskLevel(score);
  const cfg = levelConfig[level];
  const sz = sizeConfig[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        cfg.bg,
        cfg.border,
        cfg.color,
        sz.badge,
      )}
      title={`Risk score: ${score}/100`}
    >
      <span className={cn("rounded-full flex-shrink-0", cfg.dot, sz.dot)} />
      {showLabel ? cfg.label : `${score}`}
    </span>
  );
}
