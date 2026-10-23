export function StatusBadge({
  children
}) {
  const normalized = children?.toLowerCase() || "";
  const statusClass = normalized === "active" ? "good" : normalized === "inactive" ? "danger" : normalized.includes("complete") || normalized.includes("approved") || normalized.includes("received") || normalized.includes("accepted") || normalized.includes("verified") ? "good" : normalized.includes("overdue") || normalized.includes("review ·") || normalized.includes("rejected") ? "danger" : normalized.includes("progress") || normalized.includes("partial") || normalized.includes("pending") || normalized.includes("available") || normalized.includes("draft") || normalized.includes("awaiting") ? "pending" : "neutral";
  return <span className={`status-badge ${statusClass}`}>
      <span className="status-dot" aria-hidden="true" />
      {children}
    </span>;
}
