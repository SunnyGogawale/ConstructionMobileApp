import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiRequest } from "../../shared/api.js";
import { displayDate, displayDateTime } from "../../shared/formatters.js";
export function SubtaskDetailsDialog({
  projectId,
  subtask,
  token,
  onClose
}) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    apiRequest(`/api/projects/${encodeURIComponent(projectId)}/subtasks/${encodeURIComponent(subtask._id)}`, token, {
      signal: controller.signal
    }).then(result => {
      setTask(result.subtask);
      setError("");
    }).catch(requestError => {
      if (requestError.name !== "AbortError") setError(requestError.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [projectId, subtask._id, token]);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="dialog subtask-details-dialog" role="dialog" aria-modal="true" aria-labelledby="subtask-details-title">
        <div className="dialog-heading">
          <div><span className="eyebrow">TASK DETAILS</span><h2 id="subtask-details-title">{task?.title || subtask.title}</h2><p>{task?.description || subtask.description || "No description provided."}</p></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close task details"><X size={18} /></button>
        </div>
        {loading && <div className="loading-strip" role="status">Loading latest task details…</div>}
        {error && <div className="data-error" role="alert">{error}</div>}
        {task && !loading && <>
            <div className="subtask-details-meta">
              <span>Project<strong>{task.project?.name || "Current project"}</strong></span>
              <span>Assigned worker<strong>{task.assignedWorker?.name || "Assigned worker"}</strong></span>
              <span>Start date<strong>{displayDate(task.startDate)}</strong></span>
              <span>Due date<strong>{displayDate(task.dueDate)}</strong></span>
              <span>Status<strong>{task.status}</strong></span>
              <span>Progress<strong>{Number.isFinite(task.progress) ? `${task.progress}%` : "Not tracked"}</strong></span>
              <span>Created by<strong>{task.createdBy?.name || "Unknown"}</strong></span>
              <span>Created at<strong>{displayDateTime(task.createdAt)}</strong></span>
              <span>Last updated at<strong>{displayDateTime(task.updatedAt)}</strong></span>
            </div>
          </>}
        <div className="subtask-form-actions">
          <button type="button" className="button button-secondary" onClick={onClose}>Close</button>
        </div>
      </section>
    </div>;
}
