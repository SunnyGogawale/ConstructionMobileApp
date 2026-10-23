import { useState } from "react";
import { ArrowDownToLine, ChevronDown, Filter, Plus } from "lucide-react";
import { API_URL } from "../../shared/api.js";
import { displayMoney } from "../../shared/formatters.js";
import { PageHeading } from "../../components/PageHeading.jsx";
import { ProjectTable } from "./ProjectTable.jsx";
import { PaginationControls } from "../../components/PaginationControls.jsx";
export function ProjectsPage({
  projects,
  setStatusFilter,
  statusFilter,
  search,
  token,
  onClearFilters,
  onCreate,
  notify,
  onProjectSelect,
  onProjectStatusUpdate,
  onProjectDelete,
  onProjectRestore,
  currentPage,
  pageInfo,
  onPageChange
}) {
  const [exporting, setExporting] = useState(false);
  const portfolioBudget = projects.reduce((total, project) => total + (Number(project.budget) || 0), 0);
  const completed = projects.filter(project => ["Completed", "Closed"].includes(project.status)).length;
  const awaitingCrew = projects.filter(project => project.status === "Open").length;
  async function exportProjects() {
    if (exporting) return;
    setExporting(true);
    const params = new URLSearchParams();
    const status = {
      "In progress": "In Progress",
      "Awaiting crew": "Open"
    }[statusFilter] || statusFilter;
    if (status !== "All statuses") params.set("status", status);
    if (search) params.set("search", search);
    try {
      if (!API_URL) throw new Error("VITE_API_URL is not configured.");
      const response = await fetch(`${API_URL}/api/projects/export?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || `Project export failed (HTTP ${response.status}).`);
      }
      const blob = await response.blob();
      const filename = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || "projects.csv";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify("Project export downloaded.");
    } catch (error) {
      notify(error.message);
    } finally {
      setExporting(false);
    }
  }
  return <>
      <PageHeading title="Projects" description="Track delivery, crews, budgets, and milestones across your portfolio." action={<button className="button button-primary" onClick={onCreate}>
            <Plus size={17} />
            Create project
          </button>} />
      <div className="project-summary-strip">
        <div>
          <span>Loaded project budget</span>
          <strong>{displayMoney(portfolioBudget)}</strong>
          <small>{projects.length} database records in this view</small>
        </div>
        <div>
          <span>Completed in this view</span>
          <strong>{completed}</strong>
          <small>Completed or closed</small>
        </div>
        <div>
          <span>Awaiting crew in this view</span>
          <strong>{awaitingCrew}</strong>
          <small>Open for worker acceptance</small>
        </div>
        <div>
          <span>Projects shown</span>
          <strong>{projects.length}</strong>
          <small>Use search and status filters to narrow results</small>
        </div>
      </div>
      <div className="panel table-panel">
        <div className="list-toolbar">
          <div className="filter-tabs">
            <button className={statusFilter === "All statuses" && !search ? "filter-active" : ""} onClick={onClearFilters}>
              All projects <span>{projects.length}</span>
            </button>
            <button className={statusFilter === "In progress" ? "filter-active" : ""} onClick={() => setStatusFilter("In progress")}>
              In progress
            </button>
            <button className={statusFilter === "Awaiting crew" ? "filter-active" : ""} onClick={() => setStatusFilter("Awaiting crew")}>
              Awaiting crew
            </button>
            <button className={statusFilter === "Completed" ? "filter-active" : ""} onClick={() => setStatusFilter("Completed")}>
              Completed
            </button>
          </div>
          <div className="toolbar-actions">
            <label className="select-filter">
              <Filter size={15} />
              <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
                <option>All statuses</option>
                <option>In progress</option>
                <option>Awaiting crew</option>
                <option>Completed</option>
                <option>Draft</option>
                <option>Assigned</option>
                <option>Closed</option>
                <option>Cancelled</option>
              </select>
              <ChevronDown size={13} />
            </label>
            <button className="button button-secondary" onClick={exportProjects} disabled={exporting}>
              <ArrowDownToLine size={16} />
              {exporting ? "Exporting…" : "Export"}
            </button>
          </div>
        </div>
        <ProjectTable projects={projects} onSelect={onProjectSelect} onStatusUpdate={onProjectStatusUpdate} onDeleteProject={onProjectDelete} onProjectRestore={onProjectRestore} />
        <PaginationControls pageInfo={pageInfo} currentPage={currentPage} onPageChange={onPageChange} />
      </div>
    </>;
}
