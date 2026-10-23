import "./App.css";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bell, Building2, CalendarDays, ChartNoAxesCombined, ChevronDown, CircleCheck, CircleDollarSign, Clock3, Eye, EyeOff, HardHat, Menu, MoreHorizontal, Plus, Search, ShieldCheck, Users, Wallet, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { API_URL, apiRequest } from "./shared/api.js";
import { mapProject, mapModuleRows, isMappedToManager, displayMoney, displayDate } from "./shared/formatters.js";
import { navigation, pageTitles } from "./shared/config.js";
import { WebLogin } from "./features/auth/WebLogin.jsx";
import { WorkerWorkspace } from "./features/worker/WorkerWorkspace.jsx";
import { ProjectsPage } from "./features/projects/ProjectsPage.jsx";
import { ReportsPage } from "./features/reports/ReportsPage.jsx";
import { SettingsPage } from "./features/settings/SettingsPage.jsx";
import { ModulePage } from "./features/modules/ModulePage.jsx";
import { ProjectDialog } from "./features/projects/ProjectDialog.jsx";
import { RecordDialog } from "./features/people/RecordDialog.jsx";
import { ProjectWorkspaceModal } from "./features/projects/ProjectWorkspace.jsx";
import { ProjectStatusDialog, ProjectDeleteDialog } from "./features/projects/ProjectDialogs.jsx";
import { PersonActivityModal } from "./features/people/PersonActivityModal.jsx";
import { MetricCard } from "./components/MetricCard.jsx";
import { ProjectTable } from "./features/projects/ProjectTable.jsx";
import { ApprovalRow } from "./components/ApprovalRow.jsx";
import { ActivityRow } from "./components/ActivityRow.jsx";
function App() {
  const [role, setRole] = useState(null);
  const [page, setPage] = useState("login");
  const [workerTab, setWorkerTab] = useState("Home");
  const [sessionToken, setSessionToken] = useState(null);
  const [sessionUser, setSessionUser] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [statusProject, setStatusProject] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);
  const [records, setRecords] = useState({});
  const [teamMembers, setTeamMembers] = useState([]);
  const [managerOptions, setManagerOptions] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [settingsData, setSettingsData] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [peopleFilters, setPeopleFilters] = useState({
    role: "",
    status: ""
  });
  const [dialog, setDialog] = useState(false);
  const [recordDialog, setRecordDialog] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [passwordResetUser, setPasswordResetUser] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);
  const [resetPasswordBusy, setResetPasswordBusy] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInfo, setPageInfo] = useState(null);
  const [activityPerson, setActivityPerson] = useState(null);
  const [statusChangeUser, setStatusChangeUser] = useState(null);
  const [statusChangeBusy, setStatusChangeBusy] = useState(false);
  useEffect(() => {
    const savedToken = sessionStorage.getItem("buildflow-session");
    if (!savedToken || !API_URL) return;
    let active = true;
    apiRequest("/api/auth/me", savedToken).then(({
      user
    }) => {
      if (!active) return;
      setSessionToken(savedToken);
      setSessionUser(user);
      setRole(user.role);
      setPage(user.role === "worker" ? "worker" : "overview");
    }).catch(() => sessionStorage.removeItem("buildflow-session"));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);
  useEffect(() => {
    if (!sessionToken) return;
    const controller = new AbortController();
    setLoading(true);
    setDataError("");
    const load = async () => {
      try {
        if (page === "overview") {
          const [dashboard, projectData] = await Promise.all([apiRequest("/api/dashboard", sessionToken, {
            signal: controller.signal
          }), apiRequest("/api/projects?page=1&limit=25", sessionToken, {
            signal: controller.signal
          })]);
          setDashboardData(dashboard);
          setProjects((projectData.projects || []).map(mapProject));
          return;
        }
        if (page === "projects" || page === "assignment") {
          const params = new URLSearchParams({
            page: String(currentPage),
            limit: "25"
          });
          if (debouncedQuery) params.set("search", debouncedQuery);
          if (page === "assignment") params.set("status", "Open");else if (statusFilter !== "All statuses") {
            params.set("status", {
              "In progress": "In Progress",
              "Awaiting crew": "Open"
            }[statusFilter] || statusFilter);
          }
          const data = await apiRequest(`/api/projects?${params}`, sessionToken, {
            signal: controller.signal
          });
          setProjects((data.projects || []).map(mapProject));
          setPageInfo(data.pagination || null);
          return;
        }
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: "25"
        });
        if (debouncedQuery) params.set("search", debouncedQuery);
        if (page === "users") {
          if (peopleFilters.role) params.set("role", peopleFilters.role);
          if (peopleFilters.status) params.set("status", peopleFilters.status);
          const [data, managersData] = await Promise.all([apiRequest(`/api/users?${params}`, sessionToken, {
            signal: controller.signal
          }), role === "admin" ? apiRequest("/api/users/project-managers", sessionToken, {
            signal: controller.signal
          }) : Promise.resolve({
            managers: []
          })]);
          setTeamMembers(data.users || []);
          setManagerOptions(managersData.managers || []);
          setRecords(current => ({
            ...current,
            users: mapModuleRows("users", data)
          }));
          setPageInfo(data.pagination || null);
          return;
        }
        if (page === "reports") {
          const [projectsReport, financeReport, attendanceReport] = await Promise.all([apiRequest("/api/reports/projects", sessionToken, {
            signal: controller.signal
          }), apiRequest("/api/reports/finance", sessionToken, {
            signal: controller.signal
          }), apiRequest("/api/reports/attendance", sessionToken, {
            signal: controller.signal
          })]);
          setReportData({
            projects: projectsReport.report,
            finance: financeReport.report,
            attendance: attendanceReport.report
          });
          return;
        }
        const endpoint = {
          users: "/api/users",
          clients: "/api/clients",
          attendance: "/api/attendance",
          progress: "/api/progress",
          notifications: "/api/notifications",
          quotations: "/api/finance?type=quotation",
          invoices: "/api/finance?type=invoice",
          payments: "/api/finance?type=payment",
          expenses: "/api/finance?type=expense",
          reports: "/api/reports/projects",
          settings: "/api/settings"
        }[page];
        if (!endpoint) return;
        const separator = endpoint.includes("?") ? "&" : "?";
        const data = await apiRequest(`${endpoint}${separator}${params}`, sessionToken, {
          signal: controller.signal
        });
        setRecords(current => ({
          ...current,
          [page]: mapModuleRows(page, data)
        }));
        setPageInfo(data.pagination || null);
        if (page === "notifications") setUnreadCount(data.unread || 0);
        if (page === "settings") {
          setSettingsData(Object.fromEntries((data.settings || []).map(setting => [setting.key, setting.value])));
        }
      } catch (error) {
        if (error.name !== "AbortError") setDataError(error.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [sessionToken, page, currentPage, debouncedQuery, statusFilter, refreshVersion, role, peopleFilters]);
  const availableNavigation = useMemo(() => navigation.filter(item => role === "admin" || item.pm || !item.admin), [role]);
  const filteredProjects = useMemo(() => projects, [projects]);
  const notify = message => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };
  const updateSearch = value => {
    setQuery(value);
    setCurrentPage(1);
  };
  const updateStatusFilter = value => {
    setStatusFilter(value);
    setCurrentPage(1);
  };
  const handleUpdateProjectStatus = async status => {
    if (!sessionToken || role !== "admin" || !statusProject) return;
    try {
      const {
        project
      } = await apiRequest(`/api/projects/${encodeURIComponent(statusProject._id || statusProject.id)}`, sessionToken, {
        method: "PATCH",
        body: JSON.stringify({
          status
        })
      });
      const updatedProject = mapProject(project);
      setProjects(current => current.map(item => String(item._id || item.id) === String(updatedProject._id || updatedProject.id) ? updatedProject : item));
      setSelectedProject(current => current && String(current._id || current.id) === String(updatedProject._id || updatedProject.id) ? updatedProject : current);
      setRefreshVersion(value => value + 1);
      setStatusProject(null);
      notify(`Project status updated to ${status}.`);
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };
  const handleDeleteProject = async () => {
    if (!sessionToken || !["admin", "project_manager"].includes(role) || !deleteProject) return;
    try {
      const result = await apiRequest(`/api/projects/${encodeURIComponent(deleteProject._id || deleteProject.id)}`, sessionToken, {
        method: "DELETE"
      });
      if (role === "project_manager") {
        setProjects(current => current.filter(item => String(item._id || item.id) !== String(deleteProject._id || deleteProject.id)));
        setCurrentPage(1);
        setRefreshVersion(value => value + 1);
        setDeleteProject(null);
        notify(`${deleteProject.name} removed from your Projects list. Related records were retained.`);
        return;
      }
      const {
        project
      } = result;
      const updatedProject = mapProject(project);
      setProjects(current => current.map(item => String(item._id || item.id) === String(updatedProject._id || updatedProject.id) ? updatedProject : item));
      setSelectedProject(current => current && String(current._id || current.id) === String(updatedProject._id || updatedProject.id) ? updatedProject : current);
      setRefreshVersion(value => value + 1);
      setDeleteProject(null);
      notify(`${updatedProject.name} marked as cancelled. Related records were retained.`);
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };
  const handleWebLogin = async (email, password) => {
    setLoginError("");
    const apiUrl = API_URL;
    if (!apiUrl) {
      setLoginError("The API URL is not configured. Set VITE_API_URL to sign in.");
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || `Sign-in failed (HTTP ${response.status}).`);
      sessionStorage.setItem("buildflow-session", result.token);
      setSessionToken(result.token);
      setSessionUser(result.user);
      setRole(result.user.role);
      setWorkerTab("Home");
      setPage(result.user.role === "worker" ? "worker" : "overview");
    } catch (error) {
      setLoginError(error.message);
    }
  };
  const handleRegistration = async (name, email, password) => {
    const apiUrl = API_URL;
    if (!apiUrl) throw new Error("The API URL is not configured. Set VITE_API_URL to create an account.");
    const response = await fetch(`${apiUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Account creation failed.");
    return result;
  };
  const handleLogout = async () => {
    try {
      if (sessionToken) await apiRequest("/api/auth/logout", sessionToken, {
        method: "POST"
      });
    } catch (error) {
      console.error("Unable to record logout activity:", error);
    }
    sessionStorage.removeItem("buildflow-session");
    setSessionToken(null);
    setSessionUser(null);
    setRole(null);
    setDashboardData(null);
    setProjects([]);
    setRecords({});
    setPage("login");
  };
  async function handleCreateProject(event) {
    event.preventDefault();
    if (!sessionToken) return notify("Sign in before creating projects.");
    const form = new FormData(event.currentTarget);
    const name = form.get("projectName")?.toString().trim();
    if (!name) return;
    const latitude = Number(form.get("latitude"));
    const longitude = Number(form.get("longitude"));
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return notify("Capture or select a valid GPS location before saving the project.");
    }
    const isDraft = Boolean(form.get("saveDraft"));
    try {
      await apiRequest("/api/projects", sessionToken, {
        method: "POST",
        body: JSON.stringify({
          name,
          description: form.get("description")?.toString() || "",
          client: {
            name: form.get("clientName")?.toString(),
            contactName: form.get("contactName")?.toString() || "",
            contactEmail: form.get("contactEmail")?.toString() || "",
            contactPhone: form.get("contactPhone")?.toString() || ""
          },
          address: form.get("address")?.toString(),
          location: {
            latitude,
            longitude,
            radiusMetres: Number(form.get("radiusMetres"))
          },
          startDate: form.get("startDate"),
          endDate: form.get("endDate"),
          budget: Number(form.get("budget")) || 0,
          attachments: form.get("attachments")?.toString().split(",").map(url => url.trim()).filter(Boolean) || [],
          priority: form.get("priority")?.toString() || "standard",
          status: isDraft ? "Draft" : "Open",
          ...(role === "admin" ? {
            assignedManagers: form.getAll("assignedManagers").map(String)
          } : {})
        })
      });
      setDialog(false);
      setPage("projects");
      setRefreshVersion(value => value + 1);
      notify(`${name} ${isDraft ? "saved as a draft" : "created and opened for assignment"}`);
    } catch (error) {
      notify(error.message);
    }
  }
  async function handleCreateRecord(event) {
    event.preventDefault();
    if (!sessionToken) return notify("Sign in before creating records.");
    const form = new FormData(event.currentTarget);
    const value = name => form.get(name)?.toString().trim() || "";
    const number = name => Number(value(name)) || 0;
    const projectId = value("project");
    const payload = recordDialog === "users" ? {
      name: value("name"),
      email: value("email"),
      ...(editingUser ? {} : {
        password: value("password")
      }),
      ...(role === "admin" || !editingUser ? {
        role: value("role")
      } : {}),
      ...(value("role") === "worker" && role === "admin" ? {
        managerMapping: form.getAll("managerMapping").map(managerId => managerId.toString()).filter(Boolean)
      } : {})
    } : recordDialog === "clients" ? {
      name: value("name"),
      contactName: value("contactName"),
      contactEmail: value("email"),
      contactPhone: value("phone"),
      address: value("address")
    } : recordDialog === "quotations" || recordDialog === "invoices" ? {
      client: value("client"),
      projectId,
      description: value("item"),
      labourCharges: number("labour"),
      materialCharges: number("materials"),
      quantity: number("quantity"),
      unitPrice: number("unitPrice"),
      taxRate: number("tax"),
      discount: number("discount"),
      ...(recordDialog === "quotations" ? {
        validUntil: value("validUntil")
      } : {
        issueDate: value("invoiceDate"),
        dueDate: value("dueDate")
      })
    } : recordDialog === "payments" ? {
      client: value("client"),
      projectId,
      invoiceReference: value("invoice"),
      description: `Payment for invoice ${value("invoice")}`,
      amountReceived: number("amount"),
      paymentMethod: value("method"),
      transactionReference: value("reference"),
      paidAt: value("date"),
      status: value("status")
    } : {
      client: value("client"),
      projectId,
      description: value("description"),
      category: value("category"),
      total: number("amount"),
      issueDate: value("date"),
      receiptUrl: value("receipt")
    };
    const endpoints = {
      users: "/api/users",
      clients: "/api/clients",
      quotations: "/api/finance/quotation",
      invoices: "/api/finance/invoice",
      payments: "/api/finance/payment",
      expenses: "/api/finance/expense"
    };
    if (recordDialog === "users" && role === "admin" && value("role") === "worker" && !form.getAll("managerMapping").length) {
      notify("Select at least one project manager for this worker.");
      return;
    }
    try {
      await apiRequest(editingUser ? `${endpoints[recordDialog]}/${editingUser._id}` : endpoints[recordDialog], sessionToken, {
        method: editingUser ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });
      setRecordDialog("");
      setEditingUser(null);
      setRefreshVersion(version => version + 1);
      notify(editingUser ? "Team member updated." : `${pageTitles[recordDialog]} saved.`);
    } catch (error) {
      notify(error.message);
    }
  }
  async function handleResetUserPassword(event) {
    event.preventDefault();
    if (!passwordResetUser || resetPasswordBusy) return;
    if (resetPassword.length < 6 || resetPassword.length > 200) {
      notify("Use a password with 6 to 200 characters.");
      return;
    }
    if (resetPassword !== confirmResetPassword) {
      notify("Passwords do not match.");
      return;
    }
    setResetPasswordBusy(true);
    try {
      const result = await apiRequest(`/api/users/${encodeURIComponent(passwordResetUser._id || passwordResetUser.id)}/password`, sessionToken, {
        method: "POST",
        body: JSON.stringify({
          password: resetPassword
        })
      });
      setPasswordResetUser(null);
      setResetPassword("");
      setConfirmResetPassword("");
      notify(result.message || "Password reset successfully.");
    } catch (error) {
      notify(error.message);
    } finally {
      setResetPasswordBusy(false);
    }
  }
  async function handleChangeUserStatus() {
    if (!statusChangeUser || statusChangeBusy) return;
    setStatusChangeBusy(true);
    const nextActive = !statusChangeUser.active;
    try {
      await apiRequest(`/api/users/${statusChangeUser._id || statusChangeUser.id}`, sessionToken, {
        method: "PATCH",
        body: JSON.stringify({
          active: nextActive
        })
      });
      setStatusChangeUser(null);
      setRefreshVersion(version => version + 1);
      notify(`${statusChangeUser.name} is now ${nextActive ? "Active" : "Inactive"}.`);
    } catch (error) {
      notify(error.message);
    } finally {
      setStatusChangeBusy(false);
    }
  }
  function closePasswordReset() {
    if (resetPasswordBusy) return;
    setPasswordResetUser(null);
    setResetPassword("");
    setConfirmResetPassword("");
    setShowResetPassword(false);
    setShowConfirmResetPassword(false);
  }
  function openPasswordReset(user) {
    setResetPassword("");
    setConfirmResetPassword("");
    setShowResetPassword(false);
    setShowConfirmResetPassword(false);
    setPasswordResetUser(user);
  }
  const goTo = id => {
    setPage(id);
    setMobileMenu(false);
    setQuery("");
    setCurrentPage(1);
  };
  const visibleNavigation = role === "admin" ? availableNavigation : navigation.filter(item => item.id !== "settings");
  if (page === "login") {
    return <WebLogin error={loginError} onLogin={handleWebLogin} onRegister={handleRegistration} />;
  }
  if (role === "worker") {
    return <WorkerWorkspace tab={workerTab} setTab={setWorkerTab} onLogout={handleLogout} notify={notify} toast={toast} sessionToken={sessionToken} user={sessionUser} />;
  }
  const groupedNav = [...new Set(visibleNavigation.map(item => item.group))];
  return <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">
            <Building2 size={21} strokeWidth={2.5} />
          </div>
          <div className="brand-copy">
            <strong>BuildFlow</strong>
            <span>CONSTRUCTION OPS</span>
          </div>
          <button className="icon-button sidebar-close" aria-label="Close menu" onClick={() => setMobileMenu(false)}>
            <X size={19} />
          </button>
        </div>
        <div className="workspace-switch">
          <div className="workspace-symbol">{sessionUser?.name?.[0]?.toUpperCase() || "B"}</div>
          <div>
            <strong>{settingsData["workspace.companyName"] || "BuildFlow Workspace"}</strong>
            <span>Enterprise workspace</span>
          </div>
          <ChevronDown size={15} />
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          {groupedNav.map(group => <div className="nav-group" key={group}>
              <div className="nav-heading">{group}</div>
              {visibleNavigation.filter(item => item.group === group).map(({
            id,
            label,
            icon: Icon,
            count
          }) => <button key={id} className={`nav-item ${page === id ? "nav-active" : ""}`} onClick={() => goTo(id)}>
                    <Icon size={17} strokeWidth={1.8} />
                    <span>{label}</span>
                    {id === "notifications" && unreadCount > 0 ? <span className="nav-count">{unreadCount}</span> : count && <span className="nav-count">{count}</span>}
                  </button>)}
            </div>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-panel">
            <div className="help-icon">
              ?<span />
            </div>
            <div>
              <strong>Need a hand?</strong>
              <span>Visit the help center</span>
            </div>
            <ArrowRight size={15} />
          </div>
          <button className="profile-card" onClick={handleLogout}>
            <span className="profile-initials">{sessionUser?.name?.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase()}</span>
            <span className="profile-copy">
              <strong>{sessionUser?.name}</strong>
              <span>{role === "admin" ? "Administrator" : "Project manager"}</span>
            </span>
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>

      {mobileMenu && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileMenu(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button menu-toggle" aria-label="Open menu" onClick={() => setMobileMenu(true)}>
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{pageTitles[page]}</strong>
          </div>
          <label className="global-search">
            <Search size={16} />
            <input value={query} onChange={event => updateSearch(event.target.value)} placeholder="Search projects, people..." />
            <kbd>⌘ K</kbd>
          </label>
          <div className="topbar-actions">
            <span className="role-indicator"><ShieldCheck size={14} />{role === "admin" ? "Administrator" : "Project manager"}</span>
            <button className="icon-button top-notification" aria-label="Notifications" onClick={() => goTo("notifications")}>
              <Bell size={19} />
              {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
            </button>
            <span className="top-avatar-initials">{sessionUser?.name?.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase()}</span>
          </div>
        </header>

        <div className="page-content">
          {dataError && <div className="data-error"><span>{dataError}</span><button className="button button-secondary" onClick={() => setRefreshVersion(value => value + 1)}>Retry</button></div>}
          {loading && <div className="loading-strip" role="status">Refreshing records from the database…</div>}
          {page === "overview" ? <Dashboard role={role} onCreate={() => setDialog(true)} onNavigate={goTo} projects={projects} user={sessionUser} dashboardData={dashboardData} loading={loading} onProjectSelect={setSelectedProject} /> : page === "projects" ? <ProjectsPage projects={filteredProjects} setStatusFilter={updateStatusFilter} statusFilter={statusFilter} search={debouncedQuery} token={sessionToken} onClearFilters={() => {
          setQuery("");
          setStatusFilter("All statuses");
          setCurrentPage(1);
        }} onCreate={() => setDialog(true)} notify={notify} onProjectSelect={setSelectedProject} onProjectStatusUpdate={role === "admin" ? setStatusProject : null} onProjectDelete={["admin", "project_manager"].includes(role) ? setDeleteProject : null} currentPage={currentPage} pageInfo={pageInfo} onPageChange={setCurrentPage} /> : page === "reports" ? <ReportsPage reportData={reportData} loading={loading} /> : page === "settings" ? <SettingsPage settings={settingsData} key={JSON.stringify(settingsData)} onSave={async values => {
          await Promise.all(Object.entries(values).map(([key, value]) => apiRequest(`/api/settings/${encodeURIComponent(key)}`, sessionToken, {
            method: "PUT",
            body: JSON.stringify({
              value
            })
          })));
          setSettingsData(values);
        }} notify={notify} /> : <ModulePage page={page} query={query} activePeopleFilters={peopleFilters} onApplyPeopleFilters={({
          search,
          role: selectedRole,
          status
        }) => {
          setPeopleFilters({
            role: selectedRole,
            status
          });
          updateSearch(search);
        }} onClearPeopleFilters={() => {
          setPeopleFilters({
            role: "",
            status: ""
          });
          updateSearch("");
        }} onRefresh={() => setRefreshVersion(version => version + 1)} notify={notify} rows={records[page] || []} onCreate={() => {
          setEditingUser(null);
          setRecordDialog(page);
        }} onEditUser={userId => {
          const user = teamMembers.find(member => (member._id || member.id) === userId);
          if (user) {
            setEditingUser(user);
            setRecordDialog("users");
          }
        }} onViewUserActivity={userId => {
          const user = teamMembers.find(member => (member._id || member.id) === userId);
          if (role === "admin" && user) setActivityPerson(user);
          if (role === "project_manager" && user?.role === "worker" && isMappedToManager(user, sessionUser?.id || sessionUser?._id || "")) {
            setActivityPerson(user);
          }
        }} canViewUserActivity={userId => {
          const user = teamMembers.find(member => (member._id || member.id) === userId);
          return role === "admin" || role === "project_manager" && user?.role === "worker" && isMappedToManager(user, sessionUser?.id || sessionUser?._id || "");
        }} canChangeUserStatus={userId => {
          const user = teamMembers.find(member => (member._id || member.id) === userId);
          if (!user) return false;
          if (role === "admin") {
            return !(String(userId) === String(sessionUser?.id || sessionUser?._id || "") && user.active);
          }
          return role === "project_manager" && user.role === "worker" && isMappedToManager(user, sessionUser?.id || sessionUser?._id || "");
        }} onChangeUserStatus={userId => {
          const user = teamMembers.find(member => (member._id || member.id) === userId);
          if (user) setStatusChangeUser(user);
        }} canEditUsers={role === "admin" || role === "project_manager"} currentPage={currentPage} pageInfo={pageInfo} onPageChange={setCurrentPage} onMarkAllRead={async () => {
          try {
            await apiRequest("/api/notifications/read-all", sessionToken, {
              method: "PATCH"
            });
            setUnreadCount(0);
            setRefreshVersion(version => version + 1);
            notify("Notifications marked as read.");
          } catch (error) {
            notify(error.message);
          }
        }} />}
        </div>
      </main>

      {dialog && <ProjectDialog onClose={() => setDialog(false)} onSubmit={handleCreateProject} role={role} token={sessionToken} />}
      {recordDialog && <RecordDialog key={`${recordDialog}-${editingUser?._id || "new"}`} page={recordDialog} role={role} editingUser={editingUser} managerOptions={managerOptions} onClose={() => {
      setRecordDialog("");
      setEditingUser(null);
    }} onResetPassword={openPasswordReset} onSubmit={handleCreateRecord} />}
      {passwordResetUser && <div className="dialog-backdrop" role="presentation">
          <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="password-reset-title">
            <div className="dialog-heading">
              <div>
                <span className="eyebrow">PEOPLE</span>
                <h2 id="password-reset-title">Reset Password</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Close password reset" disabled={resetPasswordBusy} onClick={closePasswordReset}><X size={19} /></button>
            </div>
            <p className="password-reset-confirmation">Send a password reset link to {passwordResetUser.email}?</p>
            <form onSubmit={handleResetUserPassword}>
              <div className="password-reset-fields">
                <label>
                  New Password
                  <span className="password-reset-input">
                    <input type={showResetPassword ? "text" : "password"} name="newPassword" autoComplete="new-password" minLength={6} maxLength={200} required value={resetPassword} onChange={event => setResetPassword(event.target.value)} />
                    <button type="button" aria-label={showResetPassword ? "Hide new password" : "Show new password"} onClick={() => setShowResetPassword(value => !value)}>{showResetPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                  </span>
                </label>
                <label>
                  Confirm Password
                  <span className="password-reset-input">
                    <input type={showConfirmResetPassword ? "text" : "password"} name="confirmPassword" autoComplete="new-password" minLength={6} maxLength={200} required value={confirmResetPassword} onChange={event => setConfirmResetPassword(event.target.value)} />
                    <button type="button" aria-label={showConfirmResetPassword ? "Hide confirm password" : "Show confirm password"} onClick={() => setShowConfirmResetPassword(value => !value)}>{showConfirmResetPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                  </span>
                </label>
              </div>
              <div className="dialog-actions">
                <button type="button" className="button button-secondary" disabled={resetPasswordBusy} onClick={closePasswordReset}>Cancel</button>
                <button type="submit" className="button button-primary" disabled={resetPasswordBusy}>{resetPasswordBusy ? "Resetting…" : "Reset Password"}</button>
              </div>
            </form>
          </section>
        </div>}
      {statusChangeUser && <div className="dialog-backdrop" role="presentation">
          <section className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="status-change-title">
            <div className="dialog-heading">
              <div>
                <span className="eyebrow">PEOPLE</span>
                <h2 id="status-change-title">Change Status</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Close status confirmation" disabled={statusChangeBusy} onClick={() => setStatusChangeUser(null)}><X size={19} /></button>
            </div>
            <p>Change {statusChangeUser.name}’s status to <strong>{statusChangeUser.active ? "Inactive" : "Active"}</strong>?</p>
            <div className="dialog-actions">
              <button type="button" className="button button-secondary" disabled={statusChangeBusy} onClick={() => setStatusChangeUser(null)}>Cancel</button>
              <button type="button" className="button button-primary" disabled={statusChangeBusy} onClick={handleChangeUserStatus}>{statusChangeBusy ? "Updating…" : "Confirm change"}</button>
            </div>
          </section>
        </div>}
      {selectedProject && <ProjectWorkspaceModal project={selectedProject} token={sessionToken} role={role} user={sessionUser} notify={notify} onClose={() => setSelectedProject(null)} onNavigate={goTo} />}
      {statusProject && role === "admin" && <ProjectStatusDialog project={statusProject} onClose={() => setStatusProject(null)} onSave={handleUpdateProjectStatus} />}
      {deleteProject && ["admin", "project_manager"].includes(role) && <ProjectDeleteDialog project={deleteProject} action="Delete" impactMessage={role === "project_manager" ? "This deletes the project only from your Projects list. Project data and related records remain available to admins and other authorized users." : undefined} onClose={() => setDeleteProject(null)} onConfirm={handleDeleteProject} />}
      {activityPerson && <PersonActivityModal key={activityPerson._id || activityPerson.id} person={activityPerson} token={sessionToken} notify={notify} onClose={() => setActivityPerson(null)} />}
      {toast && <div className="toast">
          <CircleCheck size={18} />
          {toast}
        </div>}
    </div>;
}
function Dashboard({
  role,
  onCreate,
  onNavigate,
  projects,
  onProjectSelect,
  user,
  dashboardData
}) {
  const isAdmin = role === "admin";
  const [todayLabel] = useState(() => new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }));
  const summary = dashboardData?.summary || {};
  const projectStatusData = dashboardData?.projectStatus || [];
  const revenueData = (dashboardData?.monthlyRevenue || []).map(({
    month,
    revenue
  }) => ({
    month: new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
      month: "short"
    }),
    revenue: revenue / 1000
  }));
  const attendanceData = (dashboardData?.attendanceTrend || []).map(({
    day,
    workers
  }) => ({
    day: new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
      weekday: "short"
    }),
    workers
  }));
  const pendingApprovals = dashboardData?.pendingApprovals || [];
  const activities = dashboardData?.activities || [];
  const attendanceRate = summary.activeWorkers ? Math.round(summary.attendanceToday / summary.activeWorkers * 100) : 0;
  const activityColors = ["coral", "blue", "green", "amber"];
  return <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {todayLabel}
          </div>
          <h1>{isAdmin ? `Good morning, ${user?.name || "there"}` : "Your project portfolio"}</h1>
          <p>
            {isAdmin ? "Here’s what’s happening across your construction operations." : "A clear view of your sites, crews, and next steps."}
          </p>
        </div>
        <div className="heading-actions">
          <button className="button button-secondary" onClick={() => onNavigate("reports")}>
            <CalendarDays size={16} />
            Last 30 days
            <ChevronDown size={14} />
          </button>
          <button className="button button-primary" onClick={onCreate}>
            <Plus size={17} />
            Create project
          </button>
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard label="Total users" value={summary.totalUsers ?? "—"} change="Active accounts" icon={Users} onClick={() => onNavigate("users")} />
        <MetricCard label="Active workers" value={summary.activeWorkers ?? "—"} change="Current workforce" icon={HardHat} tone="green" onClick={() => onNavigate("attendance")} />
        <MetricCard label="Total projects" value={summary.totalProjects ?? "—"} change="Database records" icon={Building2} tone="blue" onClick={() => onNavigate("projects")} />
        <MetricCard label="Active projects" value={summary.activeProjects ?? "—"} change="Open or in progress" icon={ChartNoAxesCombined} onClick={() => onNavigate("projects")} />
        <MetricCard label="Completed projects" value={summary.completedProjects ?? "—"} change="Completed or closed" icon={CircleCheck} tone="green" onClick={() => onNavigate("projects")} />
        <MetricCard label="Today's attendance" value={`${attendanceRate}%`} change={`${summary.attendanceToday ?? 0} of ${summary.activeWorkers ?? 0} active workers`} icon={Clock3} tone="amber" onClick={() => onNavigate("attendance")} />
        <MetricCard label="Revenue received" value={displayMoney(summary.totalRevenue)} change="Recorded payments" icon={Wallet} tone="blue" onClick={() => onNavigate("reports")} />
        <MetricCard label="Pending payments" value={displayMoney(summary.pendingPayments)} change="Outstanding invoice balance" icon={CircleDollarSign} tone="amber" onClick={() => onNavigate("invoices")} />
      </div>

      <div className="analytics-grid">
        <section className="panel revenue-panel">
          <div className="panel-heading">
            <div>
              <h2>Revenue overview</h2>
              <p>Recognized revenue across active projects</p>
            </div>
            <button className="period-select">
              Last 6 months
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="revenue-summary">
            <strong>{displayMoney(summary.totalRevenue)}</strong>
            <span>{revenueData.length} months</span>
            <span>recorded payment history</span>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{
              top: 8,
              right: 4,
              bottom: 0,
              left: -14
            }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e87524" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#e87524" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e9eeec" strokeDasharray="3 4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{
                fill: "#8a9697",
                fontSize: 11
              }} tickMargin={12} />
                <YAxis axisLine={false} tickLine={false} tick={{
                fill: "#8a9697",
                fontSize: 10
              }} tickFormatter={value => `$${value}k`} />
                <Tooltip formatter={value => [`$${value}k`, "Revenue"]} contentStyle={{
                border: "1px solid #e6ebe8",
                borderRadius: 8,
                fontSize: 12
              }} />
                <Area type="monotone" dataKey="revenue" stroke="#e87524" strokeWidth={2.5} fill="url(#revenueFill)" activeDot={{
                r: 5,
                fill: "#e87524",
                stroke: "#fff",
                strokeWidth: 3
              }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel status-panel">
          <div className="panel-heading">
            <div>
              <h2>Project status</h2>
              <p>Portfolio health at a glance</p>
            </div>
            <button className="icon-button small-icon" aria-label="Project status options">
              <MoreHorizontal size={19} />
            </button>
          </div>
          <div className="status-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={projectStatusData} dataKey="value" nameKey="name" innerRadius={59} outerRadius={79} paddingAngle={3} stroke="none">
                  {projectStatusData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} projects`, name]} contentStyle={{
                border: "1px solid #e6ebe8",
                borderRadius: 8,
                fontSize: 12
              }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{summary.totalProjects ?? 0}</strong>
              <span>projects</span>
            </div>
          </div>
          <div className="status-legend">
            {projectStatusData.map(item => <div key={item.name}>
                <span className="legend-label">
                  <i style={{
                background: item.color
              }} />
                  {item.name}
                </span>
                <strong>{item.value}</strong>
              </div>)}
          </div>
        </section>
      </div>

      <div className="lower-grid">
        <section className="panel project-panel">
          <div className="panel-heading">
            <div>
              <h2>Active projects</h2>
              <p>Recent site activity and delivery</p>
            </div>
            <button className="text-button" onClick={() => onNavigate("projects")}>
              All projects
              <ArrowRight size={15} />
            </button>
          </div>
          <ProjectTable projects={projects.slice(0, 4)} compact onSelect={onProjectSelect} />
        </section>
        <section className="panel attendance-panel">
          <div className="panel-heading">
            <div>
              <h2>Workforce attendance</h2>
              <p>Today · all active sites</p>
            </div>
            <button className="icon-button small-icon" aria-label="Attendance options">
              <MoreHorizontal size={19} />
            </button>
          </div>
          <div className="attendance-kpi">
            <strong>{summary.attendanceToday ?? 0}</strong>
            <span>of {summary.activeWorkers ?? 0} active workers checked in today</span>
          </div>
          <div className="attendance-track">
            <span style={{
            width: `${attendanceRate}%`
          }} />
          </div>
          <div className="attendance-meta">
            <span>
              <i className="green-dot" />
              Checked in <strong>{summary.attendanceToday ?? 0}</strong>
            </span>
            <span>
              <i className="gray-dot" />
              Not checked in <strong>{Math.max(0, (summary.activeWorkers || 0) - (summary.attendanceToday || 0))}</strong>
            </span>
          </div>
          <div className="mini-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData} margin={{
              top: 6,
              right: 0,
              bottom: 0,
              left: -25
            }}>
                <CartesianGrid vertical={false} stroke="#edf0ee" strokeDasharray="3 4" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{
                fill: "#8a9697",
                fontSize: 9
              }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{
                border: "1px solid #e6ebe8",
                borderRadius: 8,
                fontSize: 11
              }} />
                <Area type="monotone" dataKey="workers" stroke="#338264" fill="#338264" fillOpacity={0.08} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <button className="attendance-link" onClick={() => onNavigate("attendance")}>
            Open attendance log
            <ArrowRight size={15} />
          </button>
        </section>
      </div>

      <div className="bottom-grid">
        <section className="panel approvals-panel">
          <div className="panel-heading">
            <div>
              <h2>Pending approvals</h2>
              <p>Items waiting for a decision</p>
            </div>
            <span className="counter-pill">{pendingApprovals.length} items</span>
            </div>
            {pendingApprovals.length ? pendingApprovals.slice(0, 4).map((item, index) => <ApprovalRow key={item._id || `${item.project?._id || "approval"}-${index}`} title={item.description || `${item.recordType || "Project"} approval`} detail={`${item.project?.name || item.project?.projectId || "Project"} · ${item.worker?.name || "Awaiting review"} · ${displayDate(item.createdAt)}`} tone={activityColors[index % activityColors.length]} />) : <p className="empty-state">No records are waiting for approval.</p>}
          <button className="panel-footer-link" onClick={() => onNavigate("progress")}>
            Review all approvals
            <ArrowRight size={15} />
          </button>
        </section>
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent activity</h2>
              <p>Across your workspace</p>
            </div>
            <button className="text-button" onClick={() => onNavigate("notifications")}>
              View all
              <ArrowRight size={15} />
            </button>
          </div>
          {activities.length ? activities.slice(0, 4).map((item, index) => {
          const actor = item.actor?.name || item.actorName || "System";
          const initials = actor.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
          return <ActivityRow key={item._id || `${item.title}-${index}`} initials={initials} color={activityColors[index % activityColors.length]} title={item.title || item.action} detail={[item.project?.name, item.detail].filter(Boolean).join(" · ")} time={displayDate(item.createdAt)} />;
        }) : <p className="empty-state">No activity has been recorded yet.</p>}
        </section>
      </div>
    </>;
}
export default App;
