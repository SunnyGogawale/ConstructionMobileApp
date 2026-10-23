import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Activity, ArrowUpRight, Check, CircleCheck, Filter, HardHat, MapPin, MoreHorizontal, Pencil, Plus, ShieldCheck } from "lucide-react";
import { columnSets, pageTitles, pageDescriptions } from "../../shared/config.js";
import { PageHeading } from "../../components/PageHeading.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { PaginationControls } from "../../components/PaginationControls.jsx";
export function ModulePage({
  page,
  query,
  activePeopleFilters = {
    role: "",
    status: ""
  },
  onApplyPeopleFilters,
  onClearPeopleFilters,
  onRefresh,
  notify,
  onCreate,
  onEditUser,
  onViewUserActivity,
  onChangeUserStatus,
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
  const [rowMenu, setRowMenu] = useState(null);
  const toolbarRef = useRef(null);
  const rowMenuRef = useRef(null);
  const rowMenuTriggerRef = useRef(null);
  useEffect(() => {
    if (!optionsOpen && !rowMenu) return undefined;
    const closeOnOutsideClick = event => {
      if (optionsOpen && !toolbarRef.current?.contains(event.target)) setOptionsOpen(false);
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
  const totalPeople = page === "users" ? pageInfo?.total ?? filteredRows.length : filteredRows.length;
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
            <button className="button button-secondary" aria-expanded={filtersOpen} aria-controls={page === "users" ? "people-filter-panel" : undefined} onClick={() => {
            if (page === "users") {
              setDraftSearch(query);
              setDraftRole(activePeopleFilters.role);
              setDraftStatus(activePeopleFilters.status);
              setFiltersOpen(open => !open);
            } else {
              notify("Filters applied to this view.");
            }
          }}>
              <Filter size={15} />
              Filters
            </button>
            <div className="module-toolbar-menu" ref={toolbarRef}>
              <button className="icon-button small-icon" onClick={() => page === "users" ? setOptionsOpen(open => !open) : notify("View options opened.")} aria-label={page === "users" ? "More list actions" : "View options"} aria-expanded={page === "users" ? optionsOpen : undefined}>
                <MoreHorizontal size={19} />
              </button>
              {page === "users" && optionsOpen && <div className="module-toolbar-dropdown" role="menu">
                  {page === "users" && <button type="button" role="menuitem" onClick={() => {
                setOptionsOpen(false);
                onClearPeopleFilters?.();
                setFiltersOpen(false);
              }}>Clear filters</button>}
                  <button type="button" role="menuitem" onClick={() => {
                setOptionsOpen(false);
                onRefresh?.();
              }}>Refresh list</button>
                </div>}
            </div>
          </div>
        </div>
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
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => <tr key={`${page}-${row[0]}`}>
                  {row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>
                      {(page === "users" ? cellIndex === 3 : cellIndex === row.length - 1) && ["users", "assignment", "attendance", "progress", "quotations", "invoices", "payments", "expenses"].includes(page) ? <StatusBadge>{cell}</StatusBadge> : page === "users" && cellIndex === 0 && canViewUserActivity?.(row.userId) ? <button className="person-name-link" type="button" onClick={() => onViewUserActivity?.(row.userId)}>{cell}</button> : <span className={cellIndex === 0 ? "strong-cell" : ""}>
                          {cell}
                        </span>}
                    </td>)}
                  <td>
                    {page === "users" ? <button className="icon-button row-action" aria-label={`More actions for ${row[0]}`} aria-haspopup="menu" aria-expanded={rowMenu?.userId === row.userId} onClick={event => {
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
            </tbody>
          </table>
        </div>
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
