export function PageHeading({
  title,
  description,
  action
}) {
  return <div className="page-heading">
      <div>
        <div className="eyebrow">CONSTRUCTION OPERATIONS</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{action}</div>
    </div>;
}
