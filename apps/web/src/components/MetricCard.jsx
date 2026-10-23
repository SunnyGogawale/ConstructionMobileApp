import { ArrowUpRight } from "lucide-react";
export function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  tone = "orange",
  onClick
}) {
  return <button className={`metric-card metric-${tone}`} onClick={onClick}>
      <span className="metric-top">
        <span className="metric-icon">
          <Icon size={18} />
        </span>
        <ArrowUpRight size={16} className="metric-arrow" />
      </span>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      <span className="metric-change">{change}</span>
    </button>;
}
