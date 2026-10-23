import { useEffect, useState } from "react";
import { ArrowDownToLine, X } from "lucide-react";
import { apiRequest, API_URL } from "../../shared/api.js";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { PaginationControls } from "../../components/PaginationControls.jsx";
export function PersonActivityModal({
  person,
  token,
  notify,
  onClose
}) {
  const [activities, setActivities] = useState([]);
  const [pageInfo, setPageInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activityType, setActivityType] = useState("");
  const [loadedRequestKey, setLoadedRequestKey] = useState("");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const requestKey = JSON.stringify([person._id || person.id, token, currentPage, fromDate, toDate, activityType]);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: "25"
    });
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (activityType) params.set("type", activityType);
    apiRequest(`/api/users/${encodeURIComponent(person._id || person.id)}/activity?${params}`, token, {
      signal: controller.signal
    }).then(result => {
      setActivities(result.activities || []);
      setPageInfo(result.pagination || null);
      setError("");
    }).catch(loadError => {
      if (loadError.name !== "AbortError") setError(loadError.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoadedRequestKey(requestKey);
    });
    return () => controller.abort();
  }, [person._id, person.id, token, currentPage, fromDate, toDate, activityType, requestKey]);
  const loading = loadedRequestKey !== requestKey;
  const visibleError = loading ? "" : error;
  const updateFilter = setter => event => {
    setter(event.target.value);
    setCurrentPage(1);
  };
  async function exportActivityLogs() {
    if (exporting) return;
    setExporting(true);
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (activityType) params.set("type", activityType);
    try {
      const response = await fetch(`${API_URL}/api/users/${encodeURIComponent(person._id || person.id)}/activity/export?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || `Export failed (HTTP ${response.status}).`);
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `activity-${person._id || person.id}.csv`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify("Activity logs exported.");
    } catch (exportError) {
      notify(exportError.message);
    } finally {
      setExporting(false);
    }
  }
  return <div className="dialog-backdrop" role="presentation">
      <section className="dialog person-activity-dialog" role="dialog" aria-modal="true" aria-labelledby="person-activity-title">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">PEOPLE</span>
            <h2 id="person-activity-title">Person Activity Logs</h2>
            <p>Read-only activity history for {person.name}.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close activity logs"><X size={19} /></button>
        </div>
        <div className="activity-log-filters">
          <label>From<input type="date" value={fromDate} onChange={updateFilter(setFromDate)} /></label>
          <label>To<input type="date" value={toDate} min={fromDate || undefined} onChange={updateFilter(setToDate)} /></label>
          <label>Activity type
            <select value={activityType} onChange={updateFilter(setActivityType)}>
              <option value="">All activity</option>
              <option value="project">Projects</option>
              <option value="assignment">Assignments</option>
              <option value="attendance">Attendance</option>
              <option value="progress">Progress</option>
              <option value="finance">Finance</option>
              <option value="people">People</option>
              <option value="system">System</option>
            </select>
          </label>
        </div>
        <div className="activity-log-toolbar">
          <span>Exports all matching logs, including other pages.</span>
          <button className="button button-secondary" type="button" onClick={exportActivityLogs} disabled={exporting}>
            <ArrowDownToLine size={15} />
            {exporting ? "Exporting…" : "Export Logs"}
          </button>
        </div>
        {visibleError && <div className="data-error" role="alert">{visibleError}</div>}
        {loading && <div className="loading-strip" role="status">Loading activity logs…</div>}
        {!loading && !visibleError && activities.length === 0 && <div className="activity-log-empty">No activity logs are available for {person.name} with the selected filters.</div>}
        {!loading && !visibleError && activities.length > 0 && <div className="table-wrap activity-log-table">
            <table>
              <thead>
                <tr><th>Date &amp; Time</th><th>Person Name</th><th>Action</th><th>Description</th><th>IP / Device</th><th>Status</th></tr>
              </thead>
              <tbody>
                {activities.map(activity => <tr key={activity.id}>
                    <td>{new Date(activity.dateTime).toLocaleString()}</td>
                    <td>{activity.personName || person.name}</td>
                    <td>{activity.action}</td>
                    <td>{activity.description || "—"}</td>
                    <td>{[activity.ipAddress, activity.deviceInfo].filter(Boolean).join(" · ") || "—"}</td>
                    <td><StatusBadge>{activity.status}</StatusBadge></td>
                  </tr>)}
              </tbody>
            </table>
          </div>}
        <PaginationControls pageInfo={pageInfo} currentPage={currentPage} onPageChange={setCurrentPage} />
      </section>
    </div>;
}
