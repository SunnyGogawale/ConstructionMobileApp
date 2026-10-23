import { useState } from "react";
import { X } from "lucide-react";
import { projectStatuses } from "../../shared/config.js";
export function ProjectStatusDialog({
  project,
  onClose,
  onSave
}) {
  const [status, setStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);
  async function saveStatus(event) {
    event.preventDefault();
    if (saving || status === project.status) return;
    setSaving(true);
    try {
      await onSave(status);
    } catch {
      return;
    } finally {
      setSaving(false);
    }
  }
  return <div className="dialog-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && !saving && onClose()}>
      <section className="dialog project-status-dialog" role="dialog" aria-modal="true" aria-labelledby="project-status-title">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">PROJECT STATUS</span>
            <h2 id="project-status-title">Update Project Status</h2>
            <p>{project.name}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close dialog" disabled={saving} onClick={onClose}><X size={19} /></button>
        </div>
        <form onSubmit={saveStatus}>
          <label>
            Project status
            <select value={status} onChange={event => setStatus(event.target.value)}>
              {projectStatuses.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <div className="dialog-actions">
            <button type="button" className="button button-secondary" disabled={saving} onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={saving || status === project.status}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </section>
    </div>;
}
export function ProjectDeleteDialog({
  project,
  onClose,
  onConfirm,
  entityType = "Project",
  action = "Delete",
  impactMessage = "This will mark the project as cancelled. Related records will be retained."
}) {
  const [deleting, setDeleting] = useState(false);
  const actionVerb = action.toLowerCase();
  const actionProgress = "Deleting…";
  async function confirmDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await onConfirm();
    } catch {
      return;
    } finally {
      setDeleting(false);
    }
  }
  return <div className="dialog-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && !deleting && onClose()}>
      <section className="dialog project-status-dialog" role="alertdialog" aria-modal="true" aria-labelledby="project-delete-title">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">{entityType.toUpperCase()} {action.toUpperCase()}</span>
            <h2 id="project-delete-title">{action} {entityType}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Close dialog" disabled={deleting} onClick={onClose}><X size={19} /></button>
        </div>
        <p>Are you sure you want to {actionVerb} <strong>{project.name}</strong>? {impactMessage}</p>
        <div className="dialog-actions">
          <button type="button" className="button button-secondary" disabled={deleting} onClick={onClose}>Cancel</button>
          <button type="button" className="button button-primary" disabled={deleting} onClick={confirmDelete}>{deleting ? actionProgress : `Confirm ${action}`}</button>
        </div>
      </section>
    </div>;
}
