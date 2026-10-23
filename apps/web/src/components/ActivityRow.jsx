export function ActivityRow({
  initials,
  color,
  title,
  detail,
  time
}) {
  return <div className="activity-row">
      <div className={`activity-avatar ${color}`}>{initials}</div>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <time>{time}</time>
    </div>;
}
