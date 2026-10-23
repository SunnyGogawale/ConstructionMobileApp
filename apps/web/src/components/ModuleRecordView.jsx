import { ArrowUpRight, FileText } from "lucide-react";
export function ModuleRecordView({
  title,
  details
}) {
  return <section className="project-record-view"><div className="panel-heading"><div><h2>{title}</h2><p>Latest records for this project</p></div></div>{details.length ? details.map((detail, index) => <div className="project-record-row" key={`${detail}-${index}`}><span className={`project-record-icon ${index === 0 ? "record-icon-orange" : ""}`}><FileText size={17} /></span><span>{detail}</span><ArrowUpRight size={15} /></div>) : <p className="empty-state">No records are available for this project.</p>}</section>;
}
