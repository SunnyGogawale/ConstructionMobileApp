import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Bell, Building2, CalendarDays, Camera, Check, ChevronDown, CircleCheck, Clock3, FileText, HardHat, LayoutDashboard, MapPin, ShieldCheck, Users } from "lucide-react";
import { apiRequest } from "../../shared/api.js";
import { displayDate } from "../../shared/formatters.js";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { PageHeading } from "../../components/PageHeading.jsx";
import { SubtaskMaterials } from "../projects/SubtaskMaterials.jsx";
import { SubtaskDetailsDialog } from "../projects/SubtaskDetailsDialog.jsx";
export function WorkerWorkspace({
  tab,
  setTab,
  onRoleChange,
  isPreview,
  onLogout,
  notify,
  toast,
  sessionToken,
  user
}) {
  const [todayLabel] = useState(() => new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }));
  const [workerData, setWorkerData] = useState({
    projects: [],
    attendance: [],
    updates: [],
    notifications: [],
    subtasks: [],
    loading: true
  });
  const [workerError, setWorkerError] = useState("");
  const [progressDescription, setProgressDescription] = useState("");
  const [progressPercent, setProgressPercent] = useState("0");
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [updatingSubtask, setUpdatingSubtask] = useState("");
  const [taskDetailsSubtask, setTaskDetailsSubtask] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    async function loadWorkerWorkspace() {
      try {
        const [projectsResult, assignedProjectsResult, attendanceResult, progressResult, notificationResult] = await Promise.all([apiRequest("/api/projects?page=1&limit=100", sessionToken, {
          signal: controller.signal
        }), apiRequest(`/api/projects?page=1&limit=100&assignedWorker=${encodeURIComponent(user.id)}`, sessionToken, {
          signal: controller.signal
        }), apiRequest("/api/attendance/me?page=1&limit=100", sessionToken, {
          signal: controller.signal
        }), apiRequest("/api/progress?page=1&limit=25", sessionToken, {
          signal: controller.signal
        }), apiRequest("/api/notifications?page=1&limit=25", sessionToken, {
          signal: controller.signal
        })]);
        const projectMap = new Map([...(projectsResult.projects || []), ...(assignedProjectsResult.projects || [])].map(project => [String(project._id), project]));
        const projects = [...projectMap.values()];
        const assignedProjects = assignedProjectsResult.projects || [];
        const subtaskResults = await Promise.all(assignedProjects.map(async project => {
          const result = await apiRequest(`/api/projects/${encodeURIComponent(project._id)}/subtasks`, sessionToken, {
            signal: controller.signal
          });
          return (result.subtasks || []).map(subtask => ({
            ...subtask,
            _projectId: project._id,
            _projectName: project.name
          }));
        }));
        if (controller.signal.aborted) return;
        setWorkerData({
          projects,
          attendance: attendanceResult.attendance || [],
          updates: progressResult.updates || [],
          notifications: notificationResult.notifications || [],
          subtasks: subtaskResults.flat(),
          loading: false
        });
        setWorkerError("");
      } catch (error) {
        if (error.name === "AbortError") return;
        setWorkerError(error.message);
        setWorkerData(current => ({
          ...current,
          loading: false
        }));
      }
    }
    loadWorkerWorkspace();
    return () => controller.abort();
  }, [sessionToken, user?.id]);
  const assignedProject = workerData.projects.find(project => String(project.assignedWorker?._id || project.assignedWorker || "") === user?.id);
  const latestUpdate = workerData.updates[0];
  const currentAttendance = workerData.attendance.find(record => ["active", "on_break"].includes(record.status));
  const checkedIn = currentAttendance?.status === "active";
  const breakStarted = currentAttendance?.status === "on_break";
  const workerInitials = user?.name?.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase() || "W";
  const workerTabs = [{
    label: "Home",
    icon: LayoutDashboard
  }, {
    label: "Projects",
    icon: Building2
  }, {
    label: "Attendance",
    icon: Clock3
  }, {
    label: "Alerts",
    icon: Bell
  }, {
    label: "Profile",
    icon: Users
  }];
  const action = checkedIn ? breakStarted ? "Resume work" : "Start break" : "Verify & check in";
  const handleMainAction = () => {
    setTab("Attendance");
    notify("Attendance verification is available in the BuildFlow worker app.");
  };
  async function saveWorkerProgress(event) {
    event.preventDefault();
    if (!assignedProject || savingProgress || progressDescription.trim().length < 10) return;
    setSavingProgress(true);
    try {
      const {
        update
      } = await apiRequest("/api/progress", sessionToken, {
        method: "POST",
        body: JSON.stringify({
          projectId: assignedProject._id,
          description: progressDescription.trim(),
          progress: Number(progressPercent),
          completedTasks: [],
          pendingTasks: []
        })
      });
      setWorkerData(current => ({
        ...current,
        updates: [update, ...current.updates]
      }));
      setProgressDescription("");
      notify("Daily progress submitted.");
    } catch (error) {
      notify(error.message);
    } finally {
      setSavingProgress(false);
    }
  }
  async function updateWorkerSubtask(subtask, status) {
    if (updatingSubtask) return;
    setUpdatingSubtask(subtask._id);
    try {
      const {
        subtask: updated
      } = await apiRequest(`/api/projects/${encodeURIComponent(subtask._projectId)}/subtasks/${encodeURIComponent(subtask._id)}`, sessionToken, {
        method: "PATCH",
        body: JSON.stringify({
          status
        })
      });
      setWorkerData(current => ({
        ...current,
        subtasks: current.subtasks.map(item => item._id === updated._id ? {
          ...updated,
          _projectId: subtask._projectId,
          _projectName: subtask._projectName
        } : item)
      }));
      notify("Subtask status updated.");
    } catch (error) {
      notify(error.message);
    } finally {
      setUpdatingSubtask("");
    }
  }
  return <div className="worker-shell">
      <header className="worker-topbar">
        <div className="worker-brand">
          <div className="brand-mark">
            <Building2 size={20} />
          </div>
          <strong>BuildFlow</strong>
        </div>
        <label className="role-select-label">
          <span>Role</span>
          <select value="worker" disabled={!isPreview} onChange={event => onRoleChange(event.target.value)}>
            <option value="worker">Worker</option>
            <option value="admin">Admin</option>
            <option value="project_manager">Project manager</option>
          </select>
          <ChevronDown size={12} />
        </label>
      </header>
      <main className="worker-content">
        {workerError && <div className="data-error" role="alert">{workerError}<button className="button button-secondary" onClick={() => window.location.reload()}>Retry</button></div>}
        {workerData.loading && <div className="loading-strip" role="status">Loading your workspace…</div>}
        {tab === "Home" ? <>
            <div className="worker-greeting">
              <div>
                <span className="eyebrow">{todayLabel}</span>
                <h1>Good morning, {user?.name || "there"}</h1>
                <p>Your site plan and shift at a glance.</p>
              </div>
              <button className="worker-avatar" onClick={() => setTab("Profile")}>
                {workerInitials}
              </button>
            </div>
            <div className="worker-project-card">
              <div className="worker-project-image" />
              <div className="worker-project-copy">
                <span className="worker-tag">
                  <span />
                  TODAY’S ASSIGNMENT
                </span>
                <h2>{assignedProject?.name || "No assigned project"}</h2>
                <p>{assignedProject?.description || "Your next assignment will appear here."}</p>
                <div className="worker-location">
                  <MapPin size={15} />
                  {assignedProject?.address || "Project location"}
                </div>
                <div className="worker-project-meta">
                  <span>
                    <small>PROJECT MANAGER</small>
                    <strong>{assignedProject?.manager?.name || "Project manager"}</strong>
                  </span>
                  <span>
                    <small>PROJECT PROGRESS</small>
                    <strong>{assignedProject?.progress ?? 0}%</strong>
                  </span>
                </div>
              </div>
            </div>
            <section className="worker-shift-card">
              <div className="worker-shift-heading">
                <div>
                  <h2>Your shift</h2>
                  <p>
                    {currentAttendance ? `${currentAttendance.status === "on_break" ? "On break" : "Active"} · ${displayDate(currentAttendance.checkedInAt)}` : "Not checked in"}
                  </p>
                </div>
                <StatusBadge>
                  {currentAttendance ? currentAttendance.status === "on_break" ? "Break active" : "On shift" : "Not checked in"}
                </StatusBadge>
              </div>
              <div className="worker-shift-info">
                <span>
                  <Clock3 size={16} />
                  {currentAttendance ? new Date(currentAttendance.checkedInAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit"
              }) : "No active shift"}
                </span>
                <span>
                  <MapPin size={16} />
                  {assignedProject?.location?.radiusMetres || "—"} m site radius
                </span>
              </div>
              <button className="button button-primary worker-main-action" onClick={handleMainAction}>
                <MapPin size={17} />
                {action}
                <ArrowRight size={17} />
              </button>
              <p className="worker-trust-note">
                <ShieldCheck size={14} />
                GPS and selfie verification are mandatory. No manual override.
              </p>
            </section>
            <div className="worker-section-title">
              <h2>Today’s work</h2>
              <button onClick={() => setTab("Projects")}>
                View project
                <ArrowRight size={15} />
              </button>
            </div>
            <div className="worker-task-card">
              <div className="task-heading">
                <div className="task-symbol">
                  <HardHat size={19} />
                </div>
                <div>
                  <strong>{latestUpdate?.description || assignedProject?.name || "No daily updates yet"}</strong>
                  <span>Daily progress · {displayDate(latestUpdate?.createdAt)}</span>
                </div>
                <StatusBadge>{latestUpdate?.reviewStatus || "Pending"}</StatusBadge>
              </div>
              <div className="task-progress-label">
                <span>Today’s progress</span>
                <strong>{latestUpdate?.progress ?? assignedProject?.progress ?? 0}%</strong>
              </div>
              <div className="worker-progress-track">
                <span style={{
              width: `${latestUpdate?.progress ?? assignedProject?.progress ?? 0}%`
            }} />
              </div>
              <button className="worker-link-action" onClick={() => setShowProgressForm(value => !value)}>
                <Camera size={16} />
                {showProgressForm ? "Close progress form" : "Add daily progress update"}
                <ArrowRight size={16} />
              </button>
              {showProgressForm && assignedProject && <form className="worker-task-card settings-form" onSubmit={saveWorkerProgress}>
                <label>Work description<input required minLength={10} maxLength={3000} value={progressDescription} onChange={event => setProgressDescription(event.target.value)} /></label>
                <label>Project progress (%)<input required type="number" min="0" max="100" value={progressPercent} onChange={event => setProgressPercent(event.target.value)} /></label>
                <button className="button button-primary" type="submit" disabled={savingProgress}>{savingProgress ? "Submitting…" : "Submit progress"}</button>
              </form>}
            </div>
            <div className="worker-stats">
              <div>
                <span className="stat-symbol green-symbol">
                  <Clock3 size={17} />
                </span>
                <strong>{workerData.attendance.length}</strong>
                <small>Recorded shifts</small>
              </div>
              <div>
                <span className="stat-symbol orange-symbol">
                  <Camera size={17} />
                </span>
                <strong>{workerData.updates.filter(update => update.reviewStatus === "Pending").length}</strong>
                <small>Updates pending</small>
              </div>
              <div>
                <span className="stat-symbol amber-symbol">
                  <Clock3 size={17} />
                </span>
                <strong>{workerData.subtasks.length}</strong>
                <small>Assigned subtasks</small>
              </div>
            </div>
            <div className="worker-section-title">
              <h2>Latest updates</h2>
              <button onClick={() => setTab("Alerts")}>
                All alerts
                <ArrowRight size={15} />
              </button>
            </div>
            {workerData.updates.length ? <div className="worker-notice">
              <span className="notice-symbol">
                <Check size={17} />
              </span>
              <span>
                <strong>{workerData.updates[0].reviewStatus} progress update</strong>
                <small>{workerData.updates[0].project?.name || assignedProject?.name || "Assigned project"} · {displayDate(workerData.updates[0].createdAt)}</small>
              </span>
              <time>{displayDate(workerData.updates[0].createdAt)}</time>
            </div> : <p>No progress updates yet.</p>}
          </> : tab === "Projects" ? <>
            <PageHeading title="My projects" description="Your current assignment and available opportunities." action={null} />
            <div className="panel worker-assignment-card">
              <span className="worker-tag">
                <span />
                CURRENT ASSIGNMENT
              </span>
              <h2>{assignedProject?.name || "No current assignment"}</h2>
              <p>{assignedProject?.description || assignedProject?.address || "Your assigned project will appear here."}</p>
              <div className="worker-location">
                <CalendarDays size={15} />
                {assignedProject ? `${displayDate(assignedProject.startDate)} – ${displayDate(assignedProject.endDate)}` : "No project schedule"}
              </div>
              <div className="worker-project-meta">
                <span>
                  <small>SITE MANAGER</small>
                  <strong>{assignedProject?.manager?.name || "—"}</strong>
                </span>
                <span>
                  <small>PROJECT STATUS</small>
                  <strong>{assignedProject?.status || "Unassigned"}</strong>
                </span>
              </div>
            </div>
            <div className="worker-section-title">
              <h2>Assigned subtasks</h2>
              <span>{workerData.subtasks.length} TASKS</span>
            </div>
            {workerData.subtasks.map(subtask => <div className="worker-task-card" key={subtask._id}>
                <div className="task-heading">
                  <div className="task-symbol"><HardHat size={19} /></div>
                  <div><strong>{subtask.title}</strong><span>{subtask._projectName} · {subtask.description || "No description"} · Due {displayDate(subtask.dueDate)}</span></div>
                  <StatusBadge>{subtask.status}</StatusBadge>
                </div>
                <button type="button" className="worker-link-action" onClick={() => setTaskDetailsSubtask(subtask)}>Task Details<ArrowRight size={15} /></button>
                <SubtaskMaterials projectId={subtask._projectId} subtask={subtask} token={sessionToken} role="worker" user={user} notify={notify} />
                <label className="worker-link-action">
                  Update status
                  <select value={subtask.status} disabled={Boolean(updatingSubtask)} onChange={event => updateWorkerSubtask(subtask, event.target.value)}>
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </label>
              </div>)}
            {!workerData.subtasks.length && <p>No subtasks are assigned to you.</p>}
            <div className="worker-section-title">
              <h2>My projects</h2>
              <span>{workerData.projects.length} PROJECTS</span>
            </div>
            {workerData.projects.map(project => <div className="worker-opportunity" key={project._id}>
                <span className="opportunity-icon">
                  <Building2 size={19} />
                </span>
                <h3>{project.name}</h3>
                <p>{project.description || project.priority}</p>
                <span>
                  <MapPin size={14} />
                  {project.address}
                </span>
                <span>
                  <CalendarDays size={14} />
                  {displayDate(project.startDate)} – {displayDate(project.endDate)}
                </span>
                <StatusBadge>{project.status}</StatusBadge>
              </div>)}
          </> : tab === "Attendance" ? <>
            <PageHeading title="Attendance verification" description="Confirm your site location before recording a shift." action={null} />
            <div className="attendance-map">
              <div className="map-road road-one" />
              <div className="map-road road-two" />
              <div className="map-road road-three" />
              <div className="map-zone" />
              <div className="map-marker-site">
                <MapPin size={20} />
              </div>
              <div className="map-site-label">
                <strong>{assignedProject?.name || "Assigned project"}</strong>
                <span>Project site</span>
              </div>
              <div className="map-legend">
                <span />
                Allowed attendance radius · {assignedProject?.location?.radiusMetres || "—"} m
              </div>
            </div>
            <div className="verification-card">
              <div className="verification-title">
                <div className="verification-icon">
                  <MapPin size={20} />
                </div>
                <div>
                  <strong>{currentAttendance ? "Verified shift recorded" : "No active verified shift"}</strong>
                  <span>
                    {currentAttendance ? `Shift ${currentAttendance.status} · checked in ${displayDate(currentAttendance.checkedInAt)}` : "Attendance records appear here after a verified check-in."}
                  </span>
                </div>
              </div>
              <div className="verification-check">
                <ShieldCheck size={18} />
                <span>Attendance is permitted only within the assigned site's radius.</span>
              </div>
              <div className="verification-check">
                <Camera size={18} />
                <span>A selfie and a live GPS fix are required.</span>
              </div>
              <button className="button button-primary" onClick={handleMainAction}>
                <MapPin size={17} />
                Start location verification
                <ArrowRight size={16} />
              </button>
              <div className="permission-help">
                {workerData.attendance.length ? `${workerData.attendance.length} attendance records are available for your account.` : "No attendance records are available yet."}
              </div>
            </div>
            <div className="worker-section-title"><h2>Recent shifts</h2><span>{workerData.attendance.length} RECORDS</span></div>
            {workerData.attendance.map(record => <div className="worker-notice" key={record._id}>
                <span className="notice-symbol"><Clock3 size={17} /></span>
                <span><strong>{record.project?.name || "Assigned project"} · {record.status}</strong><small>{displayDate(record.checkedInAt)}{record.checkedOutAt ? ` – ${displayDate(record.checkedOutAt)}` : ""}</small></span>
                <time>{record.dayKey}</time>
              </div>)}
          </> : tab === "Alerts" ? <>
            <PageHeading title="Notifications" description="Updates from your projects and crew." action={null} />
            <div className="worker-notification-list">
              {workerData.notifications.map(notification => <button className="worker-notification" key={notification._id} onClick={() => notify(notification.message)}>
                  <span className={`notification-symbol ${notification.readAt ? "" : "is-unread"}`}>
                    {notification.category === "attendance" ? <CalendarDays size={18} /> : notification.category === "project" ? <FileText size={18} /> : <Check size={18} />}
                  </span>
                  <span>
                    <strong>{notification.title}</strong>
                    <small>{notification.project?.name || notification.message} · {displayDate(notification.createdAt)}</small>
                  </span>
                  {!notification.readAt && <i />}
                </button>)}
              {!workerData.notifications.length && <p>No notifications yet.</p>}
            </div>
            <div className="worker-section-title"><h2>Daily work progress</h2><span>{workerData.updates.length} UPDATES</span></div>
            {workerData.updates.map(update => <div className="worker-notice" key={update._id}>
                <span className="notice-symbol"><Check size={17} /></span>
                <span><strong>{update.progress}% · {update.reviewStatus}</strong><small>{update.description} · {displayDate(update.workDate)}</small></span>
                <time>{update.project?.name || assignedProject?.name || "Project"}</time>
              </div>)}
          </> : <>
            <PageHeading title="Profile & settings" description="Your account, work preferences, and permissions." action={null} />
            <div className="worker-profile-card">
              <div className="worker-avatar large-avatar">{workerInitials}</div>
              <h2>{user?.name || "Worker"}</h2>
              <p>Worker · Field operations</p>
              <div className="profile-detail">
                <span>Email</span>
                <strong>{user?.email || "—"}</strong>
              </div>
              <div className="profile-detail">
                <span>Role</span>
                <strong>Worker</strong>
              </div>
              <div className="profile-detail">
                <span>Privacy</span>
                <strong>Location used only for attendance verification</strong>
              </div>
            </div>
            <button className="button button-secondary profile-signout" onClick={isPreview ? () => onRoleChange("admin") : onLogout}>
              {isPreview ? "Return to admin preview" : "Sign out"}
            </button>
          </>}
      </main>
      {taskDetailsSubtask && createPortal(<SubtaskDetailsDialog projectId={taskDetailsSubtask._projectId} subtask={taskDetailsSubtask} token={sessionToken} onClose={() => setTaskDetailsSubtask(null)} />, document.body)}
      <nav className="worker-bottom-nav">
        {workerTabs.map(({
        label,
        icon: Icon
      }) => <button key={label} className={tab === label ? "worker-tab-active" : ""} onClick={() => setTab(label)}>
            <Icon size={20} />
            <span>{label}</span>
          </button>)}
      </nav>
      {toast && <div className="toast">
          <CircleCheck size={18} />
          {toast}
        </div>}
    </div>;
}
