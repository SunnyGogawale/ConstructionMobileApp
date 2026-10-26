import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Bell, Building2, CalendarDays, Camera, Check, ChevronDown, CircleCheck, Clock3, FileText, HardHat, LayoutDashboard, MapPin, ShieldCheck, Users } from "lucide-react";
import { apiRequest } from "../../shared/api.js";
import { displayDate } from "../../shared/formatters.js";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { PageHeading } from "../../components/PageHeading.jsx";
import { SubtaskMaterials } from "../projects/SubtaskMaterials.jsx";
import { SubtaskDetailsDialog } from "../projects/SubtaskDetailsDialog.jsx";
import { WorkerSelfieDialog } from "./WorkerSelfieDialog.jsx";

function formatElapsedTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":");
}

function formatAttendanceDuration(record, now = Date.now()) {
  if (!record?.checkedInAt) return "—";
  const checkedInAt = new Date(record.checkedInAt).getTime();
  const checkedOutAt = record.checkedOutAt ? new Date(record.checkedOutAt).getTime() : now;
  if (!Number.isFinite(checkedInAt) || !Number.isFinite(checkedOutAt) || checkedOutAt < checkedInAt) return "—";
  const totalMinutes = Math.floor((checkedOutAt - checkedInAt) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
    return Promise.reject(new Error(isLocalhost
      ? "Location is unavailable in this browser. Check browser and device location settings."
      : "Location access requires a secure connection. Open the app on localhost or use HTTPS, then allow location access."));
  }
  const getPosition = options => new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
  const toLocation = position => ({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy
  });
  return getPosition({
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 0
  }).then(toLocation).catch(async error => {
    if (error.code === error.PERMISSION_DENIED) {
      throw new Error("Location permission was denied. Allow location access in your browser and device settings, then try again.");
    }
    if (![error.POSITION_UNAVAILABLE, error.TIMEOUT].includes(error.code)) {
      throw new Error(`Unable to determine your location: ${error.message || "Check location services and try again."}`);
    }
    try {
      return toLocation(await getPosition({
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 0
      }));
    } catch (retryError) {
      if (retryError.code === retryError.PERMISSION_DENIED) {
        throw new Error("Location permission was denied. Allow location access in your browser and device settings, then try again.");
      }
      if (retryError.code === retryError.TIMEOUT) {
        throw new Error("Could not get a location fix. Turn on device location services, allow this site to access location, and try again outdoors.");
      }
      throw new Error(`Location is unavailable. Check that device location services are on and retry: ${retryError.message || "No position fix was returned."}`);
    }
  });
}

async function normalizeWorkerImage(image, filename) {
  let blob = image;
  if (typeof image === "string") {
    const match = image.match(/^data:(image\/(?:jpeg|jpg|png|webp|heic));base64,([a-z\d+/=\s]+)$/i);
    if (!match) throw new Error("The selected image data is invalid. Choose or capture a supported image and retry.");
    const mimeType = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
    let binary;
    try {
      binary = atob(match[2].replace(/\s/g, ""));
    } catch {
      throw new Error("The selected image data is invalid. Choose or capture a supported image and retry.");
    }
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    blob = new Blob([bytes], { type: mimeType });
  }
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error("The selected image is empty or unavailable. Choose or capture an image and retry.");
  }

  const extensionTypes = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic"
  };
  let mimeType = blob.type.toLowerCase();
  if (mimeType === "image/jpg") mimeType = "image/jpeg";
  if (!mimeType || mimeType === "application/octet-stream") {
    const extension = filename.split(".").pop()?.toLowerCase();
    mimeType = extensionTypes[extension] || "";
  }
  if (!Object.values(extensionTypes).includes(mimeType)) {
    throw new Error("Only JPEG, PNG, WebP, or HEIC images can be uploaded.");
  }
  return {
    blob: blob.type === mimeType ? blob : new Blob([blob], { type: mimeType }),
    filename: filename.replace(/\.[^.]+$/, "") + `.${mimeType === "image/jpeg" ? "jpg" : mimeType.slice("image/".length)}`
  };
}

async function uploadWorkerImage(image, filename, token, context = {}) {
  const normalized = await normalizeWorkerImage(image, filename);
  const formData = new FormData();
  for (const [key, value] of Object.entries(context)) {
    if (value) formData.append(key, value);
  }
  formData.append("file", normalized.blob, normalized.filename);
  const { url } = await apiRequest("/api/uploads", token, {
    method: "POST",
    body: formData
  });
  if (!url) throw new Error("The image upload did not return a file reference.");
  return url;
}

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
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [updatingSubtask, setUpdatingSubtask] = useState("");
  const [taskDetailsSubtask, setTaskDetailsSubtask] = useState(null);
  const [selfieAction, setSelfieAction] = useState(null);
  const [savingSelfie, setSavingSelfie] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [clockNow, setClockNow] = useState(Date.now);
  const currentAttendance = workerData.attendance.find(record => ["active", "on_break"].includes(record.status));
  const hasActiveWorkSession = Boolean(currentAttendance);
  const hasInProgressTask = workerData.subtasks.some(subtask => subtask.status === "In Progress" && subtask.taskStartedAt);
  useEffect(() => {
    if (!hasInProgressTask && !hasActiveWorkSession) return undefined;
    const timer = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasInProgressTask, hasActiveWorkSession]);
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
        const assignedProjects = projects;
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
  const assignedProject = workerData.projects.find(project => String(project.assignedWorker?._id || project.assignedWorker || "") === user?.id)
    || workerData.projects.find(project => workerData.subtasks.some(subtask => String(subtask._projectId) === String(project._id)));
  const latestUpdate = workerData.updates[0];
  const attendanceProjectId = currentAttendance?.project?._id || currentAttendance?.project;
  const attendanceProject = currentAttendance
    ? workerData.projects.find(project => String(project._id) === String(attendanceProjectId)) || (typeof currentAttendance.project === "object" ? currentAttendance.project : null)
    : assignedProject;
  const workerProjects = [...new Map(workerData.subtasks.map(subtask => {
    const project = workerData.projects.find(item => String(item._id) === String(subtask._projectId));
    return project ? [String(project._id), project] : null;
  }).filter(Boolean)).values()];
  if (attendanceProject && !workerProjects.some(project => String(project._id) === String(attendanceProject._id))) {
    workerProjects.unshift(attendanceProject);
  }
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
  function handleMainAction() {
    if (currentAttendance) {
      if (!attendanceProject) {
        notify("The assigned project for this shift could not be found.");
        return;
      }
      setSelfieAction({
        kind: "project-check-out",
        project: attendanceProject
      });
      return;
    }
    if (!assignedProject) {
      setTab("Projects");
      notify("An assigned project is required before starting a verified shift.");
      return;
    }
    setSelfieAction({
      kind: "project-check-in",
      project: assignedProject
    });
  }

  function handleProjectCheckIn(project) {
    if (currentAttendance) {
      if (String(currentAttendance.project?._id || currentAttendance.project) !== String(project._id)) {
        notify("Another project session is active. Check out of it before checking in here.");
      }
      return;
    }
    setSelfieAction({
      kind: "project-check-in",
      project
    });
  }

  async function submitSelfie(blob, evidence) {
    if (!selfieAction || savingSelfie) return;
    setSavingSelfie(true);
    try {
      const location = await getCurrentLocation();
      const imageContext = selfieAction.kind === "task"
        ? {
            imagePurpose: selfieAction.status === "In Progress" ? "check-in" : "check-out",
            taskId: selfieAction.subtask._id
          }
        : ["project-check-in", "project-check-out"].includes(selfieAction.kind)
          ? {
              imagePurpose: selfieAction.kind === "project-check-in" ? "check-in" : "check-out",
              projectId: selfieAction.project._id || selfieAction.project.id
            }
          : {};
      const selfieUrl = await uploadWorkerImage(blob, "worker-selfie.jpg", sessionToken, imageContext);
      if (selfieAction.kind === "task") {
        const { subtask } = selfieAction;
        const activeProjectId = String(currentAttendance?.project?._id || currentAttendance?.project || "");
        if (selfieAction.status === "In Progress" && (currentAttendance?.status !== "active" || activeProjectId !== String(subtask._projectId))) {
          const { attendance } = await apiRequest("/api/attendance/check-in", sessionToken, {
            method: "POST",
            body: JSON.stringify({
              projectId: subtask._projectId,
              selfieUrl,
              ...location
            })
          });
          setWorkerData(current => ({
            ...current,
            attendance: [{
              ...attendance,
              project: selfieAction.project
            }, ...current.attendance.filter(record => record._id !== attendance._id)]
          }));
        }
        const photoUrls = selfieAction.status === "Completed"
          ? await Promise.all(evidence.workPhotos.map((photo, index) => uploadWorkerImage(photo, photo.name || `task-progress-${index + 1}.jpg`, sessionToken, {
              imagePurpose: "daily-attendance",
              taskId: subtask._id
            })))
          : [];
        const { subtask: updated, progressUpdate } = await apiRequest(`/api/projects/${encodeURIComponent(subtask._projectId)}/subtasks/${encodeURIComponent(subtask._id)}`, sessionToken, {
          method: "PATCH",
          body: JSON.stringify({
            status: selfieAction.status,
            selfieUrl,
            ...location,
            ...(selfieAction.status === "Completed" ? {
              workDescription: evidence.workDescription.trim(),
              photoUrls
            } : {})
          })
        });
        setWorkerData(current => ({
          ...current,
          subtasks: current.subtasks.map(item => item._id === updated._id ? {
            ...updated,
            _projectId: subtask._projectId,
            _projectName: subtask._projectName
          } : item),
          updates: progressUpdate ? [progressUpdate, ...current.updates.filter(item => item._id !== progressUpdate._id)] : current.updates
        }));
        notify(selfieAction.status === "In Progress" ? "Task started with selfie and GPS verification." : "Task completed with selfie and GPS verification.");
      } else if (selfieAction.kind === "project-check-in") {
        const { attendance } = await apiRequest("/api/attendance/check-in", sessionToken, {
          method: "POST",
          body: JSON.stringify({
            projectId: selfieAction.project._id || selfieAction.project.id,
            selfieUrl,
            ...location
          })
        });
        setWorkerData(current => ({
          ...current,
          attendance: [{
            ...attendance,
            project: selfieAction.project
          }, ...current.attendance.filter(record => record._id !== attendance._id)]
        }));
        notify("Project shift started with selfie and GPS verification.");
      } else {
        const photoUrls = await Promise.all(evidence.workPhotos.map((photo, index) => uploadWorkerImage(photo, photo.name || `progress-photo-${index + 1}.jpg`, sessionToken, {
          imagePurpose: "daily-attendance",
          projectId: selfieAction.project._id || selfieAction.project.id
        })));
        const { attendance, update } = await apiRequest("/api/attendance/check-out", sessionToken, {
          method: "POST",
          body: JSON.stringify({
            projectId: selfieAction.project._id || selfieAction.project.id,
            selfieUrl,
            workDescription: evidence.workDescription.trim(),
            photoUrls,
            ...location
          })
        });
        setWorkerData(current => ({
          ...current,
          attendance: current.attendance.map(record => record._id === attendance._id ? {
            ...attendance,
            project: record.project
          } : record),
          updates: update ? [update, ...current.updates.filter(item => item._id !== update._id)] : current.updates
        }));
        setShowProgressForm(false);
        notify("Project update submitted and shift checked out with selfie and GPS verification.");
      }
      setSelfieAction(null);
    } catch (error) {
      notify(error.message);
    } finally {
      setSavingSelfie(false);
    }
  }

  function handleSubtaskStatusChange(subtask, status) {
    const subtaskProjectId = String(subtask._projectId);
    const activeProjectId = String(currentAttendance?.project?._id || currentAttendance?.project || "");
    if (status === "In Progress" && currentAttendance?.status === "on_break" && activeProjectId === subtaskProjectId) {
      notify("Resume your project session before starting a task.");
      return;
    }
    if (status === "In Progress" && currentAttendance?.status === "active" && activeProjectId !== subtaskProjectId) {
      setTab("Attendance");
      notify("Check out of your current project before checking in to this task.");
      return;
    }
    if (status === "Completed") {
      if (currentAttendance?.status !== "active" || activeProjectId !== subtaskProjectId) {
        setTab("Attendance");
        notify("Start a verified shift for this project before checking out the task.");
        return;
      }
    }
    if (status === "In Progress" || status === "Completed") {
      setSelfieAction({
        kind: "task",
        subtask,
        project: workerData.projects.find(project => String(project._id) === subtaskProjectId),
        status
      });
      return;
    }
    updateWorkerSubtask(subtask, status);
  }
  async function saveWorkerProgress(event) {
    event.preventDefault();
    const progressProject = attendanceProject || assignedProject;
    if (!hasActiveWorkSession || !progressProject || savingProgress || progressDescription.trim().length < 10) return;
    setSavingProgress(true);
    try {
      const photos = await Promise.all(progressPhotos.map((photo, index) => uploadWorkerImage(photo, photo.name || `daily-progress-${index + 1}.jpg`, sessionToken, {
        imagePurpose: "daily-attendance",
        projectId: progressProject._id
      })));
      const {
        update
      } = await apiRequest("/api/progress", sessionToken, {
        method: "POST",
        body: JSON.stringify({
          projectId: progressProject._id,
          description: progressDescription.trim(),
          progress: Number(progressPercent),
          completedTasks: [],
          pendingTasks: [],
          photos
        })
      });
      setWorkerData(current => ({
        ...current,
        updates: [update, ...current.updates]
      }));
      setProgressDescription("");
      setProgressPhotos([]);
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
              {hasActiveWorkSession ? <div className="worker-session-actions">
                <button className="button button-secondary" onClick={() => setShowProgressForm(value => !value)}>
                  <Camera size={17} />
                  {showProgressForm ? "Close Daily Progress" : "Daily Progress"}
                </button>
                <button className="button button-primary worker-main-action" onClick={handleMainAction} disabled={savingSelfie}>
                  <MapPin size={17} />
                  Check-Out
                  <ArrowRight size={17} />
                </button>
              </div> : <button className="button button-primary worker-main-action" onClick={handleMainAction} disabled={!assignedProject || savingSelfie}>
                <MapPin size={17} />
                Check-In
                <ArrowRight size={17} />
              </button>}
              <p className="worker-trust-note">
                <ShieldCheck size={14} />
                GPS and selfie verification are mandatory. No manual override.
              </p>
            </section>
            <div className="worker-section-title">
              <h2>Today’s work</h2>
              <button onClick={() => {
                setExpandedTaskId(null);
                setTab("Projects");
              }}>
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
              {hasActiveWorkSession && showProgressForm && (attendanceProject || assignedProject) && <form className="worker-task-card settings-form" onSubmit={saveWorkerProgress}>
                <label>Work description<input required minLength={10} maxLength={3000} value={progressDescription} onChange={event => setProgressDescription(event.target.value)} /></label>
                <label>Project progress (%)<input required type="number" min="0" max="100" value={progressPercent} onChange={event => setProgressPercent(event.target.value)} /></label>
                <label>Progress photos<input type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple onChange={event => {
                  const selectedPhotos = Array.from(event.target.files || []);
                  if (selectedPhotos.length > 20) {
                    notify("Select no more than 20 progress photos.");
                    event.target.value = "";
                    return;
                  }
                  setProgressPhotos(selectedPhotos);
                }} /></label>
                {progressPhotos.length > 0 && <small>{progressPhotos.length} photo{progressPhotos.length === 1 ? "" : "s"} selected</small>}
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
            <PageHeading title="Assigned tasks" description="Subtasks assigned to your account." action={null} />
            <div className="worker-section-title">
              <h2>Project work session</h2>
              <span>{workerProjects.length} PROJECTS</span>
            </div>
            {workerProjects.map(project => {
              const sessionProjectId = currentAttendance?.project?._id || currentAttendance?.project;
              const sessionIsForProject = hasActiveWorkSession && String(sessionProjectId) === String(project._id);
              return <section className="worker-project-session" key={`session-${project._id}`}>
                <div>
                  <strong>{project.name}</strong>
                  <small>{sessionIsForProject ? `Session ${currentAttendance.status} · checked in ${displayDate(currentAttendance.checkedInAt)}` : "Start or manage your verified project session."}</small>
                </div>
                {sessionIsForProject ? <div className="worker-session-actions">
                  <button className="button button-secondary" onClick={() => setShowProgressForm(value => !value)}>
                    <Camera size={16} />{showProgressForm ? "Close Daily Progress" : "Daily Progress"}
                  </button>
                  <button className="button button-primary" onClick={handleMainAction} disabled={savingSelfie}>
                    <MapPin size={16} />Check-Out<ArrowRight size={15} />
                  </button>
                </div> : hasActiveWorkSession ? <small className="worker-project-session-note">
                  Another project session is active. Check it out before starting this project.
                </small> : <button className="button button-primary" onClick={() => handleProjectCheckIn(project)} disabled={savingSelfie}>
                  <MapPin size={16} />Check-In<ArrowRight size={15} />
                </button>}
              </section>;
            })}
            {hasActiveWorkSession && showProgressForm && tab === "Projects" && <form className="worker-task-card settings-form" onSubmit={saveWorkerProgress}>
              <label>Work description<input required minLength={10} maxLength={3000} value={progressDescription} onChange={event => setProgressDescription(event.target.value)} /></label>
              <label>Project progress (%)<input required type="number" min="0" max="100" value={progressPercent} onChange={event => setProgressPercent(event.target.value)} /></label>
              <label>Progress photos<input type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple onChange={event => {
                const selectedPhotos = Array.from(event.target.files || []);
                if (selectedPhotos.length > 20) {
                  notify("Select no more than 20 progress photos.");
                  event.target.value = "";
                  return;
                }
                setProgressPhotos(selectedPhotos);
              }} /></label>
              {progressPhotos.length > 0 && <small>{progressPhotos.length} photo{progressPhotos.length === 1 ? "" : "s"} selected</small>}
              <button className="button button-primary" type="submit" disabled={savingProgress}>{savingProgress ? "Submitting…" : "Submit progress"}</button>
            </form>}
            <div className="worker-section-title">
              <h2>Assigned subtasks</h2>
              <span>{workerData.subtasks.length} TASKS</span>
            </div>
            {workerData.subtasks.map(subtask => {
              const isExpanded = expandedTaskId === subtask._id;
              const detailsId = `worker-task-details-${subtask._id}`;
              return <div className="worker-task-card" key={subtask._id}>
                <button
                  type="button"
                  className="task-heading worker-task-toggle"
                  aria-expanded={isExpanded}
                  aria-controls={detailsId}
                  onClick={() => setExpandedTaskId(isExpanded ? null : subtask._id)}
                >
                  <div className="task-symbol"><HardHat size={19} /></div>
                  <div><strong>{subtask.title}</strong><span>{subtask._projectName} · {subtask.description || "No description"} · Due {displayDate(subtask.dueDate)}</span></div>
                  <StatusBadge>{subtask.status}</StatusBadge>
                  <ChevronDown className={isExpanded ? "worker-task-chevron is-expanded" : "worker-task-chevron"} size={16} aria-hidden="true" />
                </button>
                {isExpanded && <div id={detailsId} className="worker-task-details">
                  {subtask.status === "In Progress" && subtask.taskStartedAt && <div className="worker-task-timing" aria-live="off">
                    <span><strong>Date</strong>{displayDate(subtask.taskStartedAt)}</span>
                    <span><strong>Current Check-in Time</strong>{new Date(subtask.taskStartedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}</span>
                    <span><strong>Running Time</strong>{formatElapsedTime(clockNow - new Date(subtask.taskStartedAt).getTime())}</span>
                  </div>}
                  <button type="button" className="worker-link-action" onClick={() => setTaskDetailsSubtask(subtask)}>Task Details<ArrowRight size={15} /></button>
                  <SubtaskMaterials projectId={subtask._projectId} subtask={subtask} token={sessionToken} role="worker" user={user} notify={notify} />
                  {subtask.status !== "Completed" && <button
                    type="button"
                    className="button button-primary worker-task-check-in"
                    disabled={Boolean(updatingSubtask) || savingSelfie}
                    onClick={() => handleSubtaskStatusChange(subtask, subtask.status === "Pending" ? "In Progress" : "Completed")}
                  >
                    {subtask.status === "Pending" ? "Check-In" : "Check-Out"}
                  </button>}
                </div>}
              </div>;
            })}
            {!workerData.subtasks.length && <p>No subtasks are assigned to you.</p>}
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
                <strong>{attendanceProject?.name || assignedProject?.name || "Assigned project"}</strong>
                <span>Project site</span>
              </div>
              <div className="map-legend">
                <span />
                Allowed attendance radius · {attendanceProject?.location?.radiusMetres || "—"} m
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
              {hasActiveWorkSession ? <button className="button button-primary" onClick={handleMainAction} disabled={savingSelfie}>
                <MapPin size={17} />Check-Out<ArrowRight size={16} />
              </button> : <button className="button button-primary" onClick={handleMainAction} disabled={!assignedProject || savingSelfie}>
                <MapPin size={17} />Check-In<ArrowRight size={16} />
              </button>}
              <div className="permission-help">
                {workerData.attendance.length ? `${workerData.attendance.length} attendance records are available for your account.` : "No attendance records are available yet."}
              </div>
            </div>
            <div className="worker-section-title"><h2>Recent shifts</h2><span>{workerData.attendance.length} RECORDS</span></div>
            {workerData.attendance.map(record => <div className="worker-notice" key={record._id}>
                <span className="notice-symbol"><Clock3 size={17} /></span>
                <span><strong>{record.project?.name || "Assigned project"} · {record.status}</strong><small>Check-in {new Date(record.checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}{record.checkedOutAt ? ` · Check-out ${new Date(record.checkedOutAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""} · {displayDate(record.checkedInAt)}</small><small>Working hours · {formatAttendanceDuration(record, clockNow)}</small></span>
                <time>{record.dayKey}</time>
                {record.checkInSelfieUrl && <a href={record.checkInSelfieUrl} target="_blank" rel="noreferrer">Check-in selfie</a>}
                {record.checkOutSelfieUrl && <a href={record.checkOutSelfieUrl} target="_blank" rel="noreferrer">Check-out selfie</a>}
                {record.workDescription && <small>{record.workDescription}</small>}
                {record.workPhotoUrls?.map((url, index) => <a key={`${record._id}-photo-${index}`} href={url} target="_blank" rel="noreferrer">Progress photo {index + 1}</a>)}
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
      {selfieAction && <WorkerSelfieDialog
        title={selfieAction.kind === "task"
          ? `${selfieAction.status === "In Progress" ? "Start" : "Complete"} task · ${selfieAction.subtask.title}`
          : selfieAction.kind === "project-check-in" ? "Project Check-In" : "Project Update & Check-Out"}
        requireWorkEvidence={selfieAction.kind === "project-check-out" || selfieAction.kind === "task" && selfieAction.status === "Completed"}
        submitLabel={selfieAction.kind === "project-check-in" ? "Check-In" : selfieAction.kind === "project-check-out" ? "Submit Update & Check-Out" : selfieAction.status === "Completed" ? "Submit Update & Check-Out" : "Check-In"}
        saving={savingSelfie}
        onCancel={() => !savingSelfie && setSelfieAction(null)}
        onSubmit={submitSelfie}
      />}
      <nav className="worker-bottom-nav">
        {workerTabs.map(({
        label,
        icon: Icon
      }) => <button key={label} className={tab === label ? "worker-tab-active" : ""} onClick={() => {
        if (label === "Projects") setExpandedTaskId(null);
        setTab(label);
      }}>
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
