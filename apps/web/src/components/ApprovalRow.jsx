import { FileText } from "lucide-react";
export function ApprovalRow({
  title,
  detail,
  tone
}) {
  return <div className="approval-row">
      <div className={`approval-icon ${tone}`}>
        <FileText size={16} />
      </div>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <button className="review-button">Review</button>
    </div>;
}
