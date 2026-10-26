import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, CalendarDays, Camera, Clock3, Eye, ExternalLink, FileImage, LogIn, LogOut, MapPin, MoreHorizontal, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import { apiRequest } from "../../shared/api.js";
import { displayDate, displayMoney } from "../../shared/formatters.js";
import { projectTabs } from "../../shared/config.js";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { ModuleRecordView } from "../../components/ModuleRecordView.jsx";
import { SubtaskMaterials } from "./SubtaskMaterials.jsx";
import { ProjectDeleteDialog } from "./ProjectDialogs.jsx";
import { SubtaskDetailsDialog } from "./SubtaskDetailsDialog.jsx";

function formatAttendanceTime(value) {
  return value ? new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  }) : "—";
}

function formatAttendanceDuration(record) {
  if (!record.checkedInAt || !record.checkedOutAt) return "—";
  const checkIn = new Date(record.checkedInAt).getTime();
  const checkOut = new Date(record.checkedOutAt).getTime();
  const breakStart = record.breakStartedAt ? new Date(record.breakStartedAt).getTime() : null;
  const breakEnd = record.breakEndedAt ? new Date(record.breakEndedAt).getTime() : null;
  const breakDuration = breakStart && breakEnd ? breakEnd - breakStart : 0;
  const minutes = Math.max(0, Math.round((checkOut - checkIn - breakDuration) / 60000));
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

function formatCoordinate(value, positiveDirection, negativeDirection) {
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate)) return null;
  return `${Math.abs(coordinate).toFixed(4)}° ${coordinate >= 0 ? positiveDirection : negativeDirection}`;
}

function ProjectAttendanceView({ records, project }) {
  const [selfiePreview, setSelfiePreview] = useState(null);
  useEffect(() => {
    if (!selfiePreview) return undefined;
    const handleKeyDown = event => {
      if (event.key === "Escape") setSelfiePreview(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selfiePreview]);
  const attendance = [...records].sort((left, right) => {
    const leftDate = new Date(left.checkedInAt || left.attendanceDate).getTime();
    const rightDate = new Date(right.checkedInAt || right.attendanceDate).getTime();
    return rightDate - leftDate;
  });

  return <section className="project-record-view project-attendance-view">
    <div className="panel-heading">
      <div><h2>Project attendance</h2><p>Check-in records and site verification for this project.</p></div>
      <span className="attendance-record-count">{attendance.length} records</span>
    </div>
    {attendance.length ? <div className="project-attendance-list">
      {attendance.map(record => {
        const workerName = record.worker?.name || "Worker";
        const initials = workerName.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
        const latitude = formatCoordinate(record.checkInLocation?.latitude, "N", "S");
        const longitude = formatCoordinate(record.checkInLocation?.longitude, "E", "W");
        const hasCoordinates = Boolean(latitude && longitude);
        const coordinateQuery = hasCoordinates
          ? `${record.checkInLocation.latitude},${record.checkInLocation.longitude}`
          : null;
        const mapUrl = coordinateQuery
          ? `https://www.google.com/maps?q=${encodeURIComponent(coordinateQuery)}`
          : null;
        const status = record.status === "active" ? "On site" : record.status === "on_break" ? "On break" : "Present";
        const date = record.checkedInAt || record.attendanceDate;

        return <article className="project-attendance-card" key={record._id}>
          <div className="attendance-card-header">
            <span className="attendance-worker-avatar" aria-hidden="true">{initials || <UserRound size={22} />}</span>
            <div className="attendance-worker-copy">
              <strong>{workerName}</strong>
              <span>{record.worker?.employeeId || record.worker?.workerId || "Project worker"}</span>
            </div>
            <span className={`attendance-status attendance-status-${status.toLowerCase().replaceAll(" ", "-")}`}><i />{status}</span>
          </div>
          <div className="attendance-date-row">
            <span><CalendarDays size={18} />Attendance date</span>
            <strong>{displayDate(date)}</strong>
          </div>
          <div className="attendance-time-grid">
            <div><span><LogIn size={17} />Check-in time</span><strong>{formatAttendanceTime(record.checkedInAt)}</strong></div>
            <div><span><LogOut size={17} />Check-out time</span><strong>{formatAttendanceTime(record.checkedOutAt)}</strong></div>
          </div>
          <div className="attendance-hours-row">
            <span><Clock3 size={19} />Working hours</span>
            <strong>{formatAttendanceDuration(record)}</strong>
          </div>
          <div className="attendance-location-block">
            <div className="attendance-location-heading">
              <span><MapPin size={21} /><span>GPS location<strong>{record.checkedInAt ? project.address || "Project site" : "No check-in location recorded"}</strong></span></span>
              {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" aria-label="Open GPS location in maps"><ExternalLink size={18} /></a>}
            </div>
            {hasCoordinates && <p>{latitude}, {longitude}</p>}
          </div>
          <div className="attendance-selfies">
            <div>
              <span>Check-in selfie</span>
              {record.checkInSelfieUrl
                ? <button type="button" className="attendance-selfie-open" onClick={() => setSelfiePreview({ src: record.checkInSelfieUrl, title: `${workerName} · Check-in selfie` })}><FileImage size={17} />View photo<ExternalLink size={15} aria-hidden="true" /></button>
                : <span className="attendance-no-selfie"><Camera size={16} />Not recorded</span>}
            </div>
            <div>
              <span>Check-out selfie</span>
              {record.checkOutSelfieUrl
                ? <button type="button" className="attendance-selfie-open" onClick={() => setSelfiePreview({ src: record.checkOutSelfieUrl, title: `${workerName} · Check-out selfie` })}><FileImage size={17} />View photo<ExternalLink size={15} aria-hidden="true" /></button>
                : <span className="attendance-no-selfie"><Camera size={16} />Not recorded</span>}
            </div>
          </div>
          {(record.workDescription || record.workPhotoUrls?.length > 0) && <div className="attendance-project-update">
            <strong>Project update</strong>
            {record.workDescription && <p>{record.workDescription}</p>}
            {record.workPhotoUrls?.length > 0 && <div className="attendance-project-update-photos">
              {record.workPhotoUrls.map((url, index) => <button type="button" className="attendance-selfie-open" key={`${record._id}-progress-photo-${index}`} onClick={() => setSelfiePreview({ src: url, title: `${workerName} · Progress photo ${index + 1}` })}>
                <FileImage size={15} />Progress photo {index + 1}<ExternalLink size={14} aria-hidden="true" />
              </button>)}
            </div>}
          </div>}
        </article>;
      })}
    </div> : <p className="empty-state">No attendance records are available for this project.</p>}
    {selfiePreview && createPortal(<div className="attendance-selfie-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setSelfiePreview(null)}>
      <section className="attendance-selfie-dialog" role="dialog" aria-modal="true" aria-label={selfiePreview.title}>
        <div className="attendance-selfie-dialog-header">
          <strong>{selfiePreview.title}</strong>
          <button type="button" className="icon-button" onClick={() => setSelfiePreview(null)} aria-label="Close selfie preview"><X size={19} /></button>
        </div>
        <img src={selfiePreview.src} alt={selfiePreview.title} />
      </section>
    </div>, document.body)}
  </section>;
}

export function ProjectWorkspaceModal({
  project,
  onClose,
  onNavigate,
  token,
  role,
  user,
  notify,
  onProgressChange
}) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [completionProgress, setCompletionProgress] = useState(0);
  const [photoUnavailable, setPhotoUnavailable] = useState(false);
  const [relatedState, setRelatedState] = useState({
    key: "",
    records: null,
    error: ""
  });
  const projectKey = String(project._id || project.id);
  const handleCompletionChange = useCallback(progress => {
    setCompletionProgress(progress);
    onProgressChange?.(projectKey, progress);
  }, [onProgressChange, projectKey]);
  const relatedRecords = relatedState.key === projectKey ? relatedState.records : null;
  const relatedError = relatedState.key === projectKey ? relatedState.error : "";
  useEffect(() => {
    const controller = new AbortController();
    const projectId = encodeURIComponent(project.id || project._id);
    apiRequest(`/api/projects/${projectId}`, token, {
      signal: controller.signal
    }).then(({ project: latestProject }) => {
      const progress = Number(latestProject.progress) || 0;
      setCompletionProgress(progress);
      onProgressChange?.(projectKey, progress);
    }).catch(error => {
      if (error.name !== "AbortError") notify(`Unable to refresh project completion: ${error.message}`);
    });
    return () => controller.abort();
  }, [notify, onProgressChange, project.id, project._id, projectKey, token]);
  useEffect(() => {
    const controller = new AbortController();
    const projectId = encodeURIComponent(project.id || project._id);
    Promise.all([apiRequest(`/api/attendance?projectId=${projectId}&page=1&limit=10`, token, {
      signal: controller.signal
    }), apiRequest(`/api/progress?projectId=${projectId}&page=1&limit=10`, token, {
      signal: controller.signal
    }), apiRequest(`/api/finance?projectId=${projectId}&page=1&limit=10`, token, {
      signal: controller.signal
    }), apiRequest("/api/dashboard", token, {
      signal: controller.signal
    })]).then(([attendance, progress, finance, dashboard]) => {
      setRelatedState({
        key: projectKey,
        records: {
          attendance: attendance.attendance || [],
          progress: progress.updates || [],
          finance: finance.records || [],
          activities: (dashboard.activities || []).filter(item => String(item.project?._id || item.project) === String(project._id))
        },
        error: ""
      });
    }).catch(error => {
      if (error.name !== "AbortError") setRelatedState({
        key: projectKey,
        records: null,
        error: error.message
      });
    });
    return () => controller.abort();
  }, [project._id, project.id, projectKey, token]);
  const progressDetails = (relatedRecords?.progress || []).map(item => `${item.description} · ${item.worker?.name || "Worker"} · ${item.progress}% · ${item.reviewStatus}`);
  const photoDetails = [...(relatedRecords?.progress || []).flatMap(item => item.photoUrls || []), ...(relatedRecords?.attendance || []).flatMap(item => item.workPhotoUrls || [])];
  const financeDetails = (relatedRecords?.finance || []).map(item => `${item.reference} · ${displayMoney(item.total)} · ${item.status}`);
  const activityDetails = (relatedRecords?.activities || []).map(item => `${item.title} · ${item.actor?.name || item.actorName} · ${displayDate(item.createdAt)}`);
  const tabNeedsRelatedRecords = ["Attendance", "Daily progress", "Photos & documents", "Quotations & invoices", "Activity history"].includes(activeTab);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="dialog project-workspace-dialog" role="dialog" aria-modal="true" aria-labelledby="project-workspace-title">
        <div className="project-workspace-heading">
          <div className="project-workspace-photo">
            {project.image && !photoUnavailable ? <img src={project.image} alt="" onError={() => setPhotoUnavailable(true)} /> : <Building2 size={24} aria-hidden="true" />}
          </div>
          <div className="project-workspace-title"><span className="eyebrow">{project.id} · {project.client}</span><h2 id="project-workspace-title">{project.name}</h2><span className="project-workspace-meta">{project.manager} · {project.dates}</span>{role === "admin" && <span className="project-assigned-managers">Assigned Project Managers: {project.assignedManagers?.filter(Boolean).map(manager => manager.name).filter(Boolean).join(", ") || "None"}</span>}</div>
          <StatusBadge>{project.status}</StatusBadge>
          <button className="icon-button" onClick={onClose} aria-label="Close project workspace"><X size={19} /></button>
        </div>
        <div className="project-tab-strip" role="tablist" aria-label="Project sections">
          {projectTabs.map(tab => <button key={tab} role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "project-tab-active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}
        </div>
        <div className="project-workspace-content">
          {activeTab === "Overview" ? <div className="project-overview-grid"><div className="project-overview-main"><div className="project-progress-head"><div><span>Overall completion</span><strong>{completionProgress}%</strong></div><StatusBadge>{project.status}</StatusBadge></div><div className="project-overview-track"><span style={{
                width: `${completionProgress}%`
              }} /></div><div className="project-details-kpis"><div><span>Contract budget</span><strong>{displayMoney(project.budget)}</strong></div><div><span>Assigned crew</span><strong>{project.crew}</strong></div><div><span>Project manager</span><strong>{project.manager}</strong></div></div><div className="project-timeline"><h3>Project schedule</h3><div><i className="timeline-complete" /><span><strong>Start</strong><small>{project.startDate ? displayDate(project.startDate) : "Not scheduled"}</small></span><time>{project.priority || "standard"} priority</time></div><div><i className={completionProgress > 0 ? "timeline-complete" : ""} /><span><strong>Completion target</strong><small>{project.endDate ? displayDate(project.endDate) : "Not scheduled"}</small></span><time>{completionProgress}%</time></div></div></div><aside className="project-location-panel"><div className="project-mini-map"><MapPin size={23} /></div><span className="eyebrow">SITE LOCATION</span><strong>{project.address || "Location coordinates pending"}</strong><p>Attendance boundary · {project.location?.radiusMetres || "—"} m</p><button className="button button-secondary" onClick={() => onNavigate("attendance")}><Clock3 size={15} />View attendance</button></aside></div> : activeTab === "Assigned Workers" ? <AssignedWorkerSubtasks key={projectKey} project={project} token={token} role={role} user={user} notify={notify} onCompletionChange={handleCompletionChange} /> : activeTab === "Attendance" ? <ProjectAttendanceView records={relatedRecords?.attendance || []} project={project} /> : activeTab === "Daily progress" ? <ModuleRecordView title="Progress timeline" details={progressDetails} /> : activeTab === "Photos & documents" ? <ModuleRecordView title="Uploaded site photos" details={photoDetails} /> : activeTab === "Quotations & invoices" ? <ModuleRecordView title="Project finances" details={financeDetails} /> : <ModuleRecordView title="Activity history" details={activityDetails} />}
          {tabNeedsRelatedRecords && relatedError && <div className="data-error" role="alert">{relatedError}</div>}
          {tabNeedsRelatedRecords && !relatedRecords && !relatedError && <div className="loading-strip" role="status">Loading project records…</div>}
        </div>
      </section>
    </div>;
}
function assignedWorkerCompletion(subtasks, assignedWorker) {
    if (!assignedWorker) return 0;
    const uniqueSubtasks = new Map();
    for (const subtask of subtasks) {
      const workerId = subtask.assignedWorker?._id || subtask.assignedWorker;
      if (String(workerId) !== String(assignedWorker)) continue;
      uniqueSubtasks.set(String(subtask._id), subtask);
    }
    const tasks = [...uniqueSubtasks.values()];
    if (!tasks.length) return 0;
    const completed = tasks.filter(subtask => subtask.status === "Completed").length;
    return Math.round(completed / tasks.length * 100);
}
export function AssignedWorkerSubtasks({
    project,
    token,
    role,
    user,
    notify,
    onCompletionChange
}) {
  const projectId = encodeURIComponent(project.id || project._id);
  const assignedWorker = project.assignedWorker?._id || project.assignedWorker;
  const workerName = project.assignedWorker?.name || (assignedWorker ? project.crew : "");
  const canManage = role === "admin" || role === "project_manager";
  const [subtasks, setSubtasks] = useState([]);
  const [expandedSubtaskId, setExpandedSubtaskId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteSubtaskCandidate, setDeleteSubtaskCandidate] = useState(null);
  const [taskDetailsSubtask, setTaskDetailsSubtask] = useState(null);
  const [materialSubtaskId, setMaterialSubtaskId] = useState(null);
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);
  const filterAssignedSubtasks = useCallback(items => {
    const seen = new Set();
    return items.filter(item => {
      const workerId = item.assignedWorker?._id || item.assignedWorker;
      if (!assignedWorker || String(workerId) !== String(assignedWorker)) return false;
      const id = String(item._id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [assignedWorker]);
  const applySubtaskSnapshot = useCallback(items => {
    const assignedSubtasks = filterAssignedSubtasks(items);
    setSubtasks(assignedSubtasks);
    onCompletionChange?.(assignedWorkerCompletion(assignedSubtasks, assignedWorker));
    return assignedSubtasks;
  }, [assignedWorker, filterAssignedSubtasks, onCompletionChange]);
  const refreshSubtasks = useCallback(async signal => {
    const result = await apiRequest(`/api/projects/${projectId}/subtasks`, token, { signal });
    return filterAssignedSubtasks(result.subtasks || []);
  }, [filterAssignedSubtasks, projectId, token]);
  useLayoutEffect(() => {
    if (!openMenuId) return undefined;
    const positionMenu = () => {
      const button = menuButtonRef.current;
      const menu = menuRef.current;
      if (!button || !menu) return;
      const buttonRect = button.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const margin = 8;
      const spaceBelow = window.innerHeight - buttonRect.bottom - margin;
      const spaceAbove = buttonRect.top - margin;
      const below = spaceBelow >= menuRect.height || spaceBelow >= spaceAbove;
      const top = below ? Math.min(buttonRect.bottom + 4, window.innerHeight - menuRect.height - margin) : Math.max(margin, buttonRect.top - menuRect.height - 4);
      const left = Math.max(margin, Math.min(buttonRect.right - menuRect.width, window.innerWidth - menuRect.width - margin));
      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
      menu.style.visibility = "visible";
    };
    positionMenu();
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
    };
  }, [openMenuId]);
  useEffect(() => {
    if (!openMenuId) return undefined;
    const closeMenu = event => {
      if (event.type === "keydown" && event.key === "Escape") {
        setOpenMenuId(null);
        return;
      }
      if (!menuRef.current?.contains(event.target) && !menuButtonRef.current?.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeMenu);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, [openMenuId]);
  useEffect(() => {
    const controller = new AbortController();
    refreshSubtasks(controller.signal).then(assignedSubtasks => {
      setSubtasks(assignedSubtasks);
      onCompletionChange?.(assignedWorkerCompletion(assignedSubtasks, assignedWorker));
      setLoadError("");
    }).catch(error => {
      if (error.name !== "AbortError") setLoadError(error.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [assignedWorker, onCompletionChange, refreshSubtasks]);
  async function refreshAfterMutation(nextSubtasks, successMessage) {
    applySubtaskSnapshot(nextSubtasks);
    try {
      applySubtaskSnapshot(await refreshSubtasks());
      setLoadError("");
      notify(successMessage);
    } catch (error) {
      setLoadError(error.message);
      notify(`${successMessage} Completion refresh failed: ${error.message}`);
    }
  }
  async function saveSubtask(event) {
    event.preventDefault();
    if (saving || !canManage) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      title: form.get("title")?.toString().trim(),
      description: form.get("description")?.toString() || "",
      assignedWorker: form.get("assignedWorker")?.toString(),
      startDate: form.get("startDate")?.toString(),
      dueDate: form.get("dueDate")?.toString(),
      status: form.get("status")?.toString()
    };
    setSaving(true);
    try {
      const result = await apiRequest(`/api/projects/${projectId}/subtasks${editing?._id ? `/${encodeURIComponent(editing._id)}` : ""}`, token, {
        method: editing?._id ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });
      const nextSubtasks = editing?._id ? subtasks.map(item => item._id === result.subtask._id ? result.subtask : item) : [...subtasks, result.subtask];
      setEditing(null);
      await refreshAfterMutation(nextSubtasks, editing?._id ? "Subtask updated." : "Subtask created.");
    } catch (error) {
      notify(error.message);
    } finally {
      setSaving(false);
    }
  }
  async function updateStatus(subtask, status) {
    try {
      const {
        subtask: updated
      } = await apiRequest(`/api/projects/${projectId}/subtasks/${encodeURIComponent(subtask._id)}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          status
        })
      });
      const nextSubtasks = subtasks.map(item => item._id === updated._id ? updated : item);
      await refreshAfterMutation(nextSubtasks, "Subtask status updated.");
    } catch (error) {
      notify(error.message);
    }
  }
  async function deleteSubtask(subtask) {
    if (!canManage) return;
    try {
      await apiRequest(`/api/projects/${projectId}/subtasks/${encodeURIComponent(subtask._id)}`, token, {
        method: "DELETE"
      });
      const nextSubtasks = subtasks.filter(item => item._id !== subtask._id);
      setDeleteSubtaskCandidate(null);
      await refreshAfterMutation(nextSubtasks, "Subtask deleted.");
    } catch (error) {
      notify(error.message);
    }
  }
  const dateInputValue = value => value ? new Date(value).toISOString().slice(0, 10) : "";
  return <section className="project-record-view subtask-view">
      <div className="panel-heading subtask-heading">
        <div><h2>Assigned worker subtasks</h2><p>{workerName || "No worker assigned"} · Tasks for this project</p></div>
        <div className="subtask-heading-actions">
          {canManage && <button type="button" className="button button-primary" disabled={!assignedWorker || saving} onClick={() => setEditing({})}><Plus size={15} />Add Subtask</button>}
        </div>
      </div>
      {loadError && <div className="data-error" role="alert">{loadError}</div>}
      {editing !== null && canManage && <form className="subtask-form" onSubmit={saveSubtask}>
          <label>Subtask title<input name="title" required minLength="2" maxLength="180" defaultValue={editing.title || ""} /></label>
          <label>Description<textarea name="description" maxLength="3000" defaultValue={editing.description || ""} /></label>
          <div className="subtask-form-grid">
            <label>Assigned worker<select name="assignedWorker" required defaultValue={editing.assignedWorker?._id || editing.assignedWorker || assignedWorker || ""} disabled={!assignedWorker}><option value={assignedWorker || ""}>{workerName || "No worker assigned"}</option></select></label>
            <label>Status<select name="status" defaultValue={editing.status || "Pending"}><option>Pending</option><option>In Progress</option><option>Completed</option></select></label>
            <label>Start date<input name="startDate" type="date" required defaultValue={dateInputValue(editing.startDate)} /></label>
            <label>Due date<input name="dueDate" type="date" required defaultValue={dateInputValue(editing.dueDate)} /></label>
          </div>
          <div className="subtask-form-actions">
            <button type="button" className="button button-secondary" disabled={saving} onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={saving || !assignedWorker}>{saving ? "Saving…" : editing._id ? "Save changes" : "Create subtask"}</button>
          </div>
        </form>}
      {loading ? <div className="loading-strip" role="status">Loading subtasks…</div> : subtasks.length ? <div className="subtask-list">{subtasks.map(subtask => <article className="subtask-card" key={subtask._id}>
            <div className="subtask-card-top"><button type="button" className="subtask-card-toggle" aria-expanded={expandedSubtaskId === subtask._id} aria-controls={`subtask-content-${subtask._id}`} onClick={() => setExpandedSubtaskId(current => current === subtask._id ? null : subtask._id)}><h3>{subtask.title}</h3><p>{subtask.description || "No description provided."}</p></button><div className="subtask-card-actions"><StatusBadge>{subtask.status}</StatusBadge><button type="button" className="icon-button row-action" aria-label={`More actions for ${subtask.title}`} aria-haspopup="menu" aria-expanded={openMenuId === subtask._id} ref={element => {
              if (openMenuId === subtask._id) menuButtonRef.current = element;
            }} onClick={event => {
              if (openMenuId === subtask._id) setOpenMenuId(null);else {
                menuButtonRef.current = event.currentTarget;
                setOpenMenuId(subtask._id);
              }
            }}><MoreHorizontal size={18} /></button></div></div>
            {openMenuId === subtask._id && createPortal(<div className="project-row-menu" role="menu" ref={menuRef} style={{
          visibility: "hidden"
        }}>
                <button type="button" role="menuitem" onClick={() => {
            setOpenMenuId(null);
            setTaskDetailsSubtask(subtask);
          }}><Eye size={15} aria-hidden="true" />Task Details</button>
                {canManage && <button type="button" role="menuitem" onClick={() => {
            setOpenMenuId(null);
            setMaterialSubtaskId(subtask._id);
          }}><Plus size={15} aria-hidden="true" />Add Material</button>}
                {canManage && <button type="button" role="menuitem" onClick={() => {
            setOpenMenuId(null);
            setEditing(subtask);
          }}><Pencil size={15} aria-hidden="true" />Edit Subtask</button>}
                {canManage && <button type="button" role="menuitem" onClick={() => {
            setOpenMenuId(null);
            setDeleteSubtaskCandidate(subtask);
          }}><Trash2 size={15} aria-hidden="true" />Delete Subtask</button>}
              </div>, document.body)}
            <div id={`subtask-content-${subtask._id}`} hidden={expandedSubtaskId !== subtask._id}>
              <div className="subtask-card-meta"><span>Worker: <strong>{subtask.assignedWorker?.name || workerName || "Assigned worker"}</strong></span><span>Start: <strong>{displayDate(subtask.startDate)}</strong></span><span>Due: <strong>{displayDate(subtask.dueDate)}</strong></span></div>
              <SubtaskMaterials key={`${subtask._id}:${materialSubtaskId === subtask._id ? "adding" : "viewing"}`} projectId={project.id || project._id} subtask={subtask} token={token} role={role} user={user} notify={notify} isAddOpen={materialSubtaskId === subtask._id} onFormClose={() => setMaterialSubtaskId(null)} />
              {role === "worker" && <label className="subtask-status-control">Update status<select value={subtask.status} onChange={event => updateStatus(subtask, event.target.value)}><option>Pending</option><option>In Progress</option><option>Completed</option></select></label>}
            </div>
          </article>)}</div> : !loadError && <p className="empty-state">{assignedWorker ? "No subtasks have been created for this worker." : "Assign a worker to this project before creating subtasks."}</p>}
      {deleteSubtaskCandidate && canManage && createPortal(<ProjectDeleteDialog key={deleteSubtaskCandidate._id} project={{
      name: deleteSubtaskCandidate.title
    }} entityType="Subtask" impactMessage="This permanently deletes the subtask. The parent project and its other records will be retained." onClose={() => setDeleteSubtaskCandidate(null)} onConfirm={() => deleteSubtask(deleteSubtaskCandidate)} />, document.body)}
      {taskDetailsSubtask && createPortal(<SubtaskDetailsDialog projectId={project.id || project._id} subtask={taskDetailsSubtask} token={token} onClose={() => setTaskDetailsSubtask(null)} />, document.body)}
    </section>;
}
