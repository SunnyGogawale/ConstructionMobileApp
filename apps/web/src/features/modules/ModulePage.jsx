import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Activity, ArrowUpRight, Check, CircleCheck, Eye, Filter, HardHat, LoaderCircle, MapPin, MoreHorizontal, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { columnSets, pageTitles, pageDescriptions } from "../../shared/config.js";
import { PageHeading } from "../../components/PageHeading.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { PaginationControls } from "../../components/PaginationControls.jsx";
import { AttendanceDetailsDialog } from "./AttendanceDetailsDialog.jsx";
import { ProjectDeleteDialog } from "../projects/ProjectDialogs.jsx";
export function ModulePage({
  page,
  query,
  activePeopleFilters = {
    role: "",
    status: ""
  },
  activeAttendanceFilters = {},
  onApplyPeopleFilters,
  onClearPeopleFilters,
  onApplyAttendanceFilters,
  onClearAttendanceFilters,
  onRefresh,
  loading = false,
  dataError = "",
  notify,
  onCreate,
  onEditUser,
  onViewUserActivity,
  onChangeUserStatus,
  canDeleteAttendance = false,
  onDeleteAttendance,
  canEditUsers,
  canViewUserActivity,
  canChangeUserStatus,
  rows = [],
  currentPage,
  pageInfo,
  onPageChange,
  onMarkAllRead
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [draftSearch, setDraftSearch] = useState(query);
  const [draftRole, setDraftRole] = useState(activePeopleFilters.role);
  const [draftStatus, setDraftStatus] = useState(activePeopleFilters.status);
  const [draftAttendanceFilters, setDraftAttendanceFilters] = useState(activeAttendanceFilters);
  const [rowMenu, setRowMenu] = useState(null);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [attendanceToDelete, setAttendanceToDelete] = useState(null);
  const [optionsPosition, setOptionsPosition] = useState({ left: 8, top: 8 });
  const rowMenuRef = useRef(null);
  const rowMenuTriggerRef = useRef(null);
  const optionsMenuRef = useRef(null);
  const optionsTriggerRef = useRef(null);
  useEffect(() => {
    if (!optionsOpen && !rowMenu) return undefined;
    const closeOnOutsideClick = event => {
      if (optionsOpen && !optionsMenuRef.current?.contains(event.target) && !optionsTriggerRef.current?.contains(event.target)) setOptionsOpen(false);
      if (rowMenu && !rowMenuRef.current?.contains(event.target) && !rowMenuTriggerRef.current?.contains(event.target)) setRowMenu(null);
    };
    const closeOnEscape = event => {
      if (event.key === "Escape") {
        setOptionsOpen(false);
        setRowMenu(null);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [optionsOpen, rowMenu]);
  const filteredRows = rows.filter(row => row.join(" ").toLowerCase().includes(query.toLowerCase()));
  const totalPeople = ["users", "attendance"].includes(page) ? pageInfo?.total ?? filteredRows.length : filteredRows.length;
  const openOptions = event => {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = page === "users" ? 120 : 85;
    const left = Math.max(8, Math.min(rect.right - 190, window.innerWidth - 198));
    const top = rect.bottom + menuHeight + 5 <= window.innerHeight
      ? rect.bottom + 5
      : Math.max(8, rect.top - menuHeight - 5);
    optionsTriggerRef.current = event.currentTarget;
    setOptionsPosition({ left, top });
    setOptionsOpen(open => !open);
  };
  const clearAttendanceFilters = () => {
    setDraftAttendanceFilters({});
    onClearAttendanceFilters?.();
    setFiltersOpen(false);
  };
  const attendanceMenu = page === "attendance" && optionsOpen ? <div className="module-toolbar-dropdown module-toolbar-dropdown-portal" role="menu" ref={optionsMenuRef} style={optionsPosition} onPointerDown={event => event.stopPropagation()}>
    <button type="button" role="menuitem" onClick={() => {
      setOptionsOpen(false);
      clearAttendanceFilters();
    }}>Clear filters</button>
    <button type="button" role="menuitem" onClick={() => {
      setOptionsOpen(false);
      onRefresh?.();
    }}>Refresh list</button>
  </div> : null;
  const actionLabel = {
    users: "Invite user",
    clients: "Add client",
    assignment: "Create assignment",
    attendance: "Export log",
    progress: "Review updates",
    quotations: "New quotation",
    invoices: "Create invoice",
    payments: "Record payment",
    expenses: "Add expense",
    notifications: "Mark all read"
  }[page] || "Create new";
  const headers = columnSets[page] || ["Name", "Details", "Updated", "Status"];
  const action = page === "projects" ? null : <button className="button button-primary" onClick={() => page === "notifications" ? onMarkAllRead?.() : ["assignment", "attendance", "progress"].includes(page) ? notify(`${pageTitles[page]} opened for review.`) : onCreate()}>
        {page === "notifications" ? <Check size={17} /> : <Plus size={17} />}
        {actionLabel}
      </button>;
  return <>
      <PageHeading title={pageTitles[page]} description={pageDescriptions[page] || "Manage your construction operations and team workspace."} action={action} />
      <div className="module-kpis">
        <div>
          <span>Records loaded</span>
          <strong>{page === "users" ? totalPeople : rows.length}</strong>
        </div>
        <div>
          <span>Needs attention</span>
          <strong className="orange-copy">
            {rows.filter(row => /pending|review|overdue|draft|awaiting|inactive/i.test(row.join(" "))).length}
          </strong>
        </div>
        <div>
          <span>Showing</span>
          <strong>{totalPeople} matching records</strong>
        </div>
        <div>
          <span>Search</span>
          <strong>{query ? "Filtered" : "All loaded records"}</strong>
        </div>
      </div>
      {page === "assignment" && <div className="assignment-banner">
          <div className="assignment-banner-icon">
            <HardHat size={19} />
          </div>
          <div>
            <strong>Exclusive assignment</strong>
            <span>
              Worker acceptance must be confirmed by the server. An accepted
              project is immediately removed from every other eligible worker’s
              list.
            </span>
          </div>
          <ShieldCheck size={20} />
        </div>}
      {page === "attendance" && <div className="verification-banner">
          <MapPin size={18} />
          <span>
            GPS radius is enforced at 100 m. Location verification cannot be
            manually overridden.
          </span>
          <StatusBadge>GPS required</StatusBadge>
        </div>}
      {page === "invoices" && <div className="finance-summary">
          <strong>
            Payments received this month <b>$124,800</b>
          </strong>
          <strong>
            Due in 7 days <b>$68,400</b>
          </strong>
          <strong>
            Past due <b className="red-copy">$18,600</b>
          </strong>
        </div>}
      <div className="panel table-panel module-table">
        <div className="list-toolbar">
          <div className="table-heading-copy">
            <strong>
              {page === "notifications" ? "Latest updates" : `All ${pageTitles[page]?.toLowerCase()}`}
            </strong>
            <span>{totalPeople} records in this view</span>
          </div>
          <div className="toolbar-actions">
            {page === "attendance" && <button className="button button-secondary" onClick={onRefresh} disabled={loading}>
                {loading ? <><LoaderCircle size={14} className="attendance-refresh-spinner" /> Refreshing</> : "Refresh"}
              </button>}
            <button className="button button-secondary" aria-expanded={filtersOpen} aria-controls={page === "users" ? "people-filter-panel" : page === "attendance" ? "attendance-filter-panel" : undefined} onClick={() => {
            if (page === "users") {
              setDraftSearch(query);
              setDraftRole(activePeopleFilters.role);
              setDraftStatus(activePeopleFilters.status);
              setFiltersOpen(open => !open);
            } else if (page === "attendance") {
              setDraftAttendanceFilters(activeAttendanceFilters);
              setFiltersOpen(open => !open);
            } else {
              notify("Filters applied to this view.");
            }
          }}>
              <Filter size={15} />
              Filters
            </button>
            <div className="module-toolbar-menu">
              <button className="icon-button small-icon" onClick={event => page === "users" || page === "attendance" ? openOptions(event) : notify("View options opened.")} aria-label={page === "users" ? "More list actions" : page === "attendance" ? "Attendance actions" : "View options"} aria-haspopup={page === "users" || page === "attendance" ? "menu" : undefined} aria-expanded={page === "users" || page === "attendance" ? optionsOpen : undefined}>
                <MoreHorizontal size={19} />
              </button>
              {page === "users" && optionsOpen && createPortal(<div className="module-toolbar-dropdown module-toolbar-dropdown-portal" role="menu" ref={optionsMenuRef} style={optionsPosition} onPointerDown={event => event.stopPropagation()}>
                <button type="button" role="menuitem" onClick={() => {
                  setOptionsOpen(false);
                  onClearPeopleFilters?.();
                  setFiltersOpen(false);
                }}>Clear filters</button>
                <button type="button" role="menuitem" onClick={() => {
                  setOptionsOpen(false);
                  onRefresh?.();
                }}>Refresh list</button>
              </div>, document.body)}
            </div>
          </div>
        </div>
        {attendanceMenu && createPortal(attendanceMenu, document.body)}
        {page === "attendance" && filtersOpen && <form id="attendance-filter-panel" className="people-filter-panel attendance-filter-panel" onSubmit={event => {
          event.preventDefault();
          onApplyAttendanceFilters?.(draftAttendanceFilters);
          setFiltersOpen(false);
        }}>
          <label>Worker name<input value={draftAttendanceFilters.worker || ""} onChange={event => setDraftAttendanceFilters(current => ({ ...current, worker: event.target.value }))} placeholder="Worker name" /></label>
          <label>Project name<input value={draftAttendanceFilters.project || ""} onChange={event => setDraftAttendanceFilters(current => ({ ...current, project: event.target.value }))} placeholder="Project name" /></label>
          <label>Check-In from<input type="date" value={draftAttendanceFilters.checkInFrom || ""} onChange={event => setDraftAttendanceFilters(current => ({ ...current, checkInFrom: event.target.value }))} /></label>
          <label>Check-In to<input type="date" value={draftAttendanceFilters.checkInTo || ""} onChange={event => setDraftAttendanceFilters(current => ({ ...current, checkInTo: event.target.value }))} /></label>
          <label>Check-Out from<input type="date" value={draftAttendanceFilters.checkOutFrom || ""} onChange={event => setDraftAttendanceFilters(current => ({ ...current, checkOutFrom: event.target.value }))} /></label>
          <label>Check-Out to<input type="date" value={draftAttendanceFilters.checkOutTo || ""} onChange={event => setDraftAttendanceFilters(current => ({ ...current, checkOutTo: event.target.value }))} /></label>
          <label>GPS FIX<select value={draftAttendanceFilters.gpsFix || ""} onChange={event => setDraftAttendanceFilters(current => ({ ...current, gpsFix: event.target.value }))}>
            <option value="">All GPS statuses</option>
            <option value="verified">Verified</option>
            <option value="recorded">Fix recorded</option>
            <option value="unavailable">GPS data unavailable</option>
          </select></label>
          <div className="people-filter-actions">
            <button className="button button-secondary" type="button" onClick={clearAttendanceFilters}>Clear filters</button>
            <button className="button button-primary" type="submit">Apply filters</button>
          </div>
        </form>}
        {page === "users" && filtersOpen && <form id="people-filter-panel" className="people-filter-panel" onSubmit={event => {
        event.preventDefault();
        onApplyPeopleFilters?.({
          search: draftSearch,
          role: draftRole,
          status: draftStatus
        });
        setFiltersOpen(false);
      }}>
            <label>
              Search
              <input value={draftSearch} onChange={event => setDraftSearch(event.target.value)} placeholder="Name or email" />
            </label>
            <label>
              Role
              <select value={draftRole} onChange={event => setDraftRole(event.target.value)}>
                <option value="">All roles</option>
                <option value="admin">Admin</option>
                <option value="project_manager">Project Manager</option>
                <option value="worker">Worker</option>
              </select>
            </label>
            <label>
              Status
              <select value={draftStatus} onChange={event => setDraftStatus(event.target.value)}>
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <div className="people-filter-actions">
              <button className="button button-secondary" type="button" onClick={() => {
            setDraftSearch("");
            setDraftRole("");
            setDraftStatus("");
            onClearPeopleFilters?.();
            setFiltersOpen(false);
          }}>Reset filters</button>
              <button className="button button-primary" type="submit">Apply filters</button>
            </div>
          </form>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {headers.map(header => <th key={header}>{header}</th>)}
                {page !== "attendance" && <th aria-label="Actions" />}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => <tr key={`${page}-${row[0]}`}>
                  {row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>
                      {(page === "users" ? cellIndex === 3 : cellIndex === row.length - 1) && ["users", "assignment", "progress", "quotations", "invoices", "payments", "expenses"].includes(page) ? <StatusBadge>{cell}</StatusBadge> : page === "users" && cellIndex === 0 && canViewUserActivity?.(row.userId) ? <button className="person-name-link" type="button" onClick={() => onViewUserActivity?.(row.userId)}>{cell}</button> : <span className={cellIndex === 0 ? "strong-cell" : ""}>
                          {cell}
                        </span>}
                    </td>)}
                  <td>
                    {page === "attendance" ? <div className="attendance-row-actions">
                        <button className="icon-button row-action" aria-label={`View attendance details for ${row[0]}`} onClick={() => setSelectedAttendance(row.attendanceRecord)}>
                          <Eye size={16} />
                        </button>
                        {canDeleteAttendance && <button type="button" className="icon-button row-action attendance-delete-icon" aria-label={`Delete attendance for ${row[0]}`} title="Delete attendance record" onClick={() => setAttendanceToDelete(row.attendanceRecord)}>
                          <Trash2 size={16} />
                        </button>}
                      </div> : page === "users" ? <button className="icon-button row-action" aria-label={`More actions for ${row[0]}`} aria-haspopup="menu" aria-expanded={rowMenu?.userId === row.userId} onClick={event => {
                  event.stopPropagation();
                  if (rowMenu?.userId === row.userId) {
                    setRowMenu(null);
                    return;
                  }
                  const rect = event.currentTarget.getBoundingClientRect();
                  rowMenuTriggerRef.current = event.currentTarget;
                  setRowMenu({
                    userId: row.userId,
                    name: row[0],
                    left: Math.max(8, rect.right - 184),
                    top: Math.min(rect.bottom + 4, window.innerHeight - 110)
                  });
                }}>
                        <MoreHorizontal size={17} />
                      </button> : <button className="icon-button row-action" aria-label={`Open ${row[0]}`} onClick={() => notify(`${row[0]} details opened.`)}>
                        <ArrowUpRight size={16} />
                      </button>}
                  </td>
                </tr>)}
              {page === "attendance" && !loading && !dataError && filteredRows.length === 0 && <tr><td className="attendance-empty-state" colSpan={headers.length}>No attendance records match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        {selectedAttendance && <AttendanceDetailsDialog attendance={selectedAttendance} onClose={() => setSelectedAttendance(null)} />}
        {attendanceToDelete && <ProjectDeleteDialog
          project={{ name: `${attendanceToDelete.worker?.name || "Worker"} · ${attendanceToDelete.project?.name || "Project"}` }}
          entityType="attendance record"
          action="Delete"
          impactMessage="This permanently deletes the attendance record. Related progress updates and tasks are retained, with their attendance links removed."
          onClose={() => setAttendanceToDelete(null)}
          onConfirm={async () => {
            await onDeleteAttendance?.(attendanceToDelete);
            setAttendanceToDelete(null);
          }}
        />}
        {rowMenu && page === "users" && createPortal(<div className="people-row-menu" role="menu" ref={rowMenuRef} style={{
        left: rowMenu.left,
        top: rowMenu.top
      }} onPointerDown={event => event.stopPropagation()}>
            {canEditUsers && <button type="button" role="menuitem" onClick={() => {
          setRowMenu(null);
          onEditUser?.(rowMenu.userId);
        }}>
                <Pencil size={14} /> Edit team member
              </button>}
            {canViewUserActivity?.(rowMenu.userId) && <button type="button" role="menuitem" onClick={() => {
          setRowMenu(null);
          onViewUserActivity?.(rowMenu.userId);
        }}>
                <Activity size={14} /> View activity logs
              </button>}
            {canChangeUserStatus?.(rowMenu.userId) && <button type="button" role="menuitem" onClick={() => {
          setRowMenu(null);
          onChangeUserStatus?.(rowMenu.userId);
        }}>
                <CircleCheck size={14} /> Change Status
              </button>}
          </div>, document.body)}
        <PaginationControls pageInfo={pageInfo} currentPage={currentPage} onPageChange={onPageChange} />
      </div>
    </>;
}
