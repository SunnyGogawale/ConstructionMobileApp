import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MobileWorkerApp from "../../mobile/App.jsx";
import { createPortal } from "react-dom";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  CircleCheck,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Filter,
  HardHat,
  LayoutDashboard,
  MapPin,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Circle, CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const navigation = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    group: "Workspace",
  },
  { id: "projects", label: "Projects", icon: Building2, group: "Workspace" },
  {
    id: "assignment",
    label: "Worker assignment",
    icon: HardHat,
    group: "Workspace",
    pm: true,
  },
  { id: "attendance", label: "Attendance", icon: Clock3, group: "Workspace" },
  {
    id: "progress",
    label: "Work progress",
    icon: Activity,
    group: "Workspace",
  },
  { id: "users", label: "People", icon: Users, group: "Manage", admin: true, pm: true },
  {
    id: "clients",
    label: "Clients",
    icon: BriefcaseBusiness,
    group: "Manage",
    pm: true,
  },
  {
    id: "quotations",
    label: "Quotations",
    icon: FileText,
    group: "Finance",
    pm: true,
  },
  {
    id: "invoices",
    label: "Invoices",
    icon: FileText,
    group: "Finance",
    pm: true,
  },
  {
    id: "payments",
    label: "Payments",
    icon: CreditCard,
    group: "Finance",
    pm: true,
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: Wallet,
    group: "Finance",
    pm: true,
  },
  {
    id: "reports",
    label: "Reports & analytics",
    icon: ChartNoAxesCombined,
    group: "Insights",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    group: "Insights",
    count: "3",
  },
  {
    id: "settings",
    label: "Settings & access",
    icon: Settings,
    group: "System",
    admin: true,
  },
];

const pageTitles = {
  overview: "Overview",
  projects: "Projects",
  assignment: "Worker assignment",
  attendance: "Attendance",
  progress: "Work progress",
  users: "People",
  clients: "Clients",
  quotations: "Quotations",
  invoices: "Invoices",
  payments: "Payments",
  expenses: "Expenses",
  reports: "Reports & analytics",
  notifications: "Notifications",
  settings: "Settings & access",
};

const pageDescriptions = {
  projects:
    "Track delivery, crews, budgets, and milestones across your portfolio.",
  assignment: "Match available site work with qualified workers and crews.",
  attendance: "Review location-verified shifts and daily workforce coverage.",
  progress: "Review field updates, submitted photos, and completion requests.",
  users: "Manage your workforce, project managers, and account access.",
  clients: "Keep client contacts, active work, and account value in one place.",
  quotations:
    "Prepare and track project estimates from draft through approval.",
  invoices: "Monitor due dates, payment progress, and outstanding balances.",
  payments: "Reconcile received payments against project invoices.",
  expenses: "Review job costs and receipts submitted by your team.",
  reports: "Analyze project delivery, workforce, and financial performance.",
  notifications: "Recent updates across projects, attendance, and finance.",
  settings: "Configure workspace access and administrative preferences.",
};

const columnSets = {
  users: ["Name", "Role", "Manager Mapping", "Status", "Added"],
  clients: ["Client", "Primary contact", "Active project", "Contract value"],
  assignment: [
    "Available project",
    "Site & distance",
    "Schedule",
    "Crew needed",
    "Status",
  ],
  attendance: ["Worker", "Project", "Check-in", "GPS fix", "Verification"],
  progress: [
    "Work update",
    "Submitted by",
    "Time",
    "Progress",
    "Review status",
  ],
  quotations: ["Quotation", "Client", "Project", "Total", "Status"],
  invoices: ["Invoice", "Client", "Issued", "Due date", "Total", "Status"],
  payments: ["Reference", "Client", "Date", "Method", "Amount", "Status"],
  expenses: ["Expense", "Project", "Date", "Category", "Amount", "Approval"],
  notifications: ["Update", "Related record", "Time", "Category"],
};

function StatusBadge({ children }) {
  const normalized = children?.toLowerCase() || "";
  const statusClass =
    normalized === "active"
      ? "good"
      : normalized === "inactive"
        ? "danger"
        :
    normalized.includes("complete") ||
    normalized.includes("approved") ||
    normalized.includes("received") ||
    normalized.includes("accepted") ||
    normalized.includes("verified")
      ? "good"
      : normalized.includes("overdue") ||
          normalized.includes("review ·") ||
          normalized.includes("rejected")
        ? "danger"
        : normalized.includes("progress") ||
            normalized.includes("partial") ||
            normalized.includes("pending") ||
            normalized.includes("available") ||
            normalized.includes("draft") ||
            normalized.includes("awaiting")
          ? "pending"
          : "neutral";
  return (
    <span className={`status-badge ${statusClass}`}>
      <span className="status-dot" aria-hidden="true" />
      {children}
    </span>
  );
}

function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  tone = "orange",
  onClick,
}) {
  return (
    <button className={`metric-card metric-${tone}`} onClick={onClick}>
      <span className="metric-top">
        <span className="metric-icon">
          <Icon size={18} />
        </span>
        <ArrowUpRight size={16} className="metric-arrow" />
      </span>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      <span className="metric-change">{change}</span>
    </button>
  );
}

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

async function completePasswordReset(token, password) {
  if (!API_URL) throw new Error("VITE_API_URL is not configured.");
  const response = await fetch(`${API_URL}/api/auth/password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || `Password reset failed (HTTP ${response.status}).`);
  return result;
}

async function apiRequest(path, token, options = {}) {
  if (!API_URL) throw new Error("VITE_API_URL is not configured.");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return result;
}

const displayDate = value => value ? new Date(value).toLocaleDateString() : "—";
const displayMoney = value => `$${(Number(value) || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

function mapProject(project) {
  return {
    ...project,
    id: project.projectId || project._id,
    clientName: project.client?.name || "—",
    client: project.client?.name || "—",
    manager: project.manager?.name || "—",
    crew: project.assignedWorker?.name || (project.assignedWorker ? "Assigned" : "Crew needed"),
    dates: `${displayDate(project.startDate)} – ${displayDate(project.endDate)}`,
    budgetLabel: displayMoney(project.budget),
    progress: Number(project.progress) || 0,
    image: project.coverImage || "",
  };
}

function managerList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function isMappedToManager(user, managerId) {
  const mappings = managerList(user?.managerMapping);
  if (mappings.length) {
    return mappings.some(manager => String(manager?._id || manager?.id || manager) === String(managerId));
  }
  return String(user?.createdBy || "") === String(managerId);
}

function mapModuleRows(page, payload) {
  if (page === "assignment") return (payload.projects || []).map(project => [project.name, project.address, `${displayDate(project.startDate)} – ${displayDate(project.endDate)}`, project.assignedWorker?.name || "Crew needed", project.status]);
  if (page === "users") return (payload.users || []).map(user => Object.assign([
    user.name,
    user.role === "project_manager" ? "Project manager" : user.role,
    user.role === "worker" ? managerList(user.managerMapping).map(manager => manager.name).filter(Boolean).join(", ") || "Unassigned" : "—",
    user.active ? "Active" : "Inactive",
    displayDate(user.createdAt),
  ], {
    userId: user._id || user.id,
    userRole: user.role,
    userActive: Boolean(user.active),
    managerMappingIds: managerList(user.managerMapping).map(manager => manager?._id || manager?.id || manager).filter(Boolean),
    createdById: user.createdBy || "",
  }));
  if (page === "clients") return (payload.clients || []).map(client => [client.name, client.contactName || "—", client.contactEmail || client.contactPhone || "—", client.active ? "Active" : "Inactive"]);
  if (page === "attendance") return (payload.attendance || []).map(item => [item.worker?.name || "Worker", item.project?.name || item.project?.projectId || "—", displayDate(item.checkedInAt), item.checkInLocation ? `${item.checkInLocation.distanceMetres} m · ±${item.checkInLocation.accuracyMetres} m` : "—", item.status]);
  if (page === "progress") return (payload.updates || []).map(item => [item.description, item.worker?.name || "Worker", displayDate(item.createdAt), `${item.progress}%`, item.reviewStatus]);
  if (page === "notifications") return (payload.notifications || []).map(item => [item.title, item.project?.name || item.message, displayDate(item.createdAt), item.category]);
  const recordType = { quotations: "quotation", invoices: "invoice", payments: "payment", expenses: "expense" }[page];
  if (recordType) return (payload.records || []).map(item => {
    if (page === "quotations") return [item.reference, item.client, item.project?.name || item.projectReference, displayMoney(item.total), item.status];
    if (page === "invoices") return [item.reference, item.client, displayDate(item.issueDate), displayDate(item.dueDate), displayMoney(item.total), item.status];
    if (page === "payments") return [item.reference, item.client, displayDate(item.paidAt), item.paymentMethod, displayMoney(item.amountReceived), item.status];
    return [item.description, item.project?.name || item.projectReference, displayDate(item.issueDate), item.category, displayMoney(item.total), item.status];
  });
  return [];
}

function WebWorkspaceApp({ onRoleChange }) {
  const [role, setRole] = useState(null);
  const [page, setPage] = useState("login");
  const [sessionToken, setSessionToken] = useState(null);
  const [sessionUser, setSessionUser] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
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
  const [peopleFilters, setPeopleFilters] = useState({ role: "", status: "" });
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
    apiRequest("/api/auth/me", savedToken).then(({ user }) => {
      if (!active) return;
      if (user.role === "worker") {
        onRoleChange?.("worker");
        setLoginError("Worker accounts use the BuildFlow mobile app.");
        return;
      }
      setSessionToken(savedToken);
      setSessionUser(user);
      setRole(user.role);
      onRoleChange?.(user.role);
      setPage("overview");
    }).catch(() => {
      sessionStorage.removeItem("buildflow-session");
      onRoleChange?.(null);
    });
    return () => { active = false; };
  }, [onRoleChange]);

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
          const [dashboard, projectData] = await Promise.all([
            apiRequest("/api/dashboard", sessionToken, { signal: controller.signal }),
            apiRequest("/api/projects?page=1&limit=25", sessionToken, { signal: controller.signal }),
          ]);
          setDashboardData(dashboard);
          setProjects((projectData.projects || []).map(mapProject));
          return;
        }
        if (page === "projects" || page === "assignment") {
          const params = new URLSearchParams({ page: String(currentPage), limit: "25" });
          if (debouncedQuery) params.set("search", debouncedQuery);
          if (page === "assignment") params.set("status", "Open");
          else if (statusFilter !== "All statuses") {
            params.set("status", {
              "In progress": "In Progress",
              "Awaiting crew": "Open",
            }[statusFilter] || statusFilter);
          }
          const data = await apiRequest(`/api/projects?${params}`, sessionToken, { signal: controller.signal });
          setProjects((data.projects || []).map(mapProject));
          setPageInfo(data.pagination || null);
          return;
        }
        const params = new URLSearchParams({ page: String(currentPage), limit: "25" });
        if (debouncedQuery) params.set("search", debouncedQuery);
        if (page === "users") {
          if (peopleFilters.role) params.set("role", peopleFilters.role);
          if (peopleFilters.status) params.set("status", peopleFilters.status);
          const [data, managersData] = await Promise.all([
            apiRequest(`/api/users?${params}`, sessionToken, { signal: controller.signal }),
            role === "admin"
              ? apiRequest("/api/users/project-managers", sessionToken, { signal: controller.signal })
              : Promise.resolve({ managers: [] }),
          ]);
          setTeamMembers(data.users || []);
          setManagerOptions(managersData.managers || []);
          setRecords(current => ({ ...current, users: mapModuleRows("users", data) }));
          setPageInfo(data.pagination || null);
          return;
        }
        if (page === "reports") {
          const [projectsReport, financeReport, attendanceReport] = await Promise.all([
            apiRequest("/api/reports/projects", sessionToken, { signal: controller.signal }),
            apiRequest("/api/reports/finance", sessionToken, { signal: controller.signal }),
            apiRequest("/api/reports/attendance", sessionToken, { signal: controller.signal }),
          ]);
          setReportData({
            projects: projectsReport.report,
            finance: financeReport.report,
            attendance: attendanceReport.report,
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
          settings: "/api/settings",
        }[page];
        if (!endpoint) return;
        const separator = endpoint.includes("?") ? "&" : "?";
        const data = await apiRequest(`${endpoint}${separator}${params}`, sessionToken, { signal: controller.signal });
        setRecords(current => ({ ...current, [page]: mapModuleRows(page, data) }));
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

  const availableNavigation = useMemo(
    () =>
      navigation.filter(item => role === "admin" || item.pm || !item.admin),
    [role],
  );

  const filteredProjects = useMemo(
    () => projects,
    [projects],
  );

  const notify = (message) => {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || `Sign-in failed (HTTP ${response.status}).`);
      if (result.user.role === "worker") throw new Error("Worker accounts use the BuildFlow mobile app.");
      sessionStorage.setItem("buildflow-session", result.token);
      setSessionToken(result.token);
      setSessionUser(result.user);
      setRole(result.user.role);
      onRoleChange?.(result.user.role);
      setPage("overview");
    } catch (error) {
      setLoginError(error.message);
    }
  };

  const handleRegistration = async (name, email, password) => {
    const apiUrl = API_URL;
    if (!apiUrl) throw new Error("The API URL is not configured. Set VITE_API_URL to create an account.");
    const response = await fetch(`${apiUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Account creation failed.");
    return result;
  };

  const handleLogout = async () => {
    try {
      if (sessionToken) await apiRequest("/api/auth/logout", sessionToken, { method: "POST" });
    } catch (error) {
      console.error("Unable to record logout activity:", error);
    }
    sessionStorage.removeItem("buildflow-session");
    onRoleChange?.(null);
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
            contactPhone: form.get("contactPhone")?.toString() || "",
          },
          address: form.get("address")?.toString(),
          location: {
            latitude: Number(form.get("latitude")),
            longitude: Number(form.get("longitude")),
            radiusMetres: Number(form.get("radiusMetres")),
          },
          startDate: form.get("startDate"),
          endDate: form.get("endDate"),
          budget: Number(form.get("budget")) || 0,
          attachments: form.get("attachments")?.toString().split(",").map((url) => url.trim()).filter(Boolean) || [],
          priority: form.get("priority")?.toString() || "standard",
          status: isDraft ? "Draft" : "Open",
        }),
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
    const value = (name) => form.get(name)?.toString().trim() || "";
    const number = (name) => Number(value(name)) || 0;
    const projectId = value("project");
    const payload = recordDialog === "users"
      ? {
          name: value("name"),
          email: value("email"),
          ...(editingUser ? {} : { password: value("password") }),
          ...(role === "admin" || !editingUser ? { role: value("role") } : {}),
          ...(value("role") === "worker" && role === "admin"
            ? { managerMapping: form.getAll("managerMapping").map(managerId => managerId.toString()).filter(Boolean) }
            : {}),
        }
      : recordDialog === "clients"
        ? { name: value("name"), contactName: value("contactName"), contactEmail: value("email"), contactPhone: value("phone"), address: value("address") }
        : recordDialog === "quotations" || recordDialog === "invoices"
          ? {
              client: value("client"), projectId, description: value("item"),
              labourCharges: number("labour"), materialCharges: number("materials"), quantity: number("quantity"),
              unitPrice: number("unitPrice"), taxRate: number("tax"), discount: number("discount"),
              ...(recordDialog === "quotations" ? { validUntil: value("validUntil") } : { issueDate: value("invoiceDate"), dueDate: value("dueDate") }),
            }
          : recordDialog === "payments"
            ? { client: value("client"), projectId, invoiceReference: value("invoice"), description: `Payment for invoice ${value("invoice")}`, amountReceived: number("amount"), paymentMethod: value("method"), transactionReference: value("reference"), paidAt: value("date"), status: value("status") }
            : { client: value("client"), projectId, description: value("description"), category: value("category"), total: number("amount"), issueDate: value("date"), receiptUrl: value("receipt") };
    const endpoints = { users: "/api/users", clients: "/api/clients", quotations: "/api/finance/quotation", invoices: "/api/finance/invoice", payments: "/api/finance/payment", expenses: "/api/finance/expense" };
    if (recordDialog === "users" && role === "admin" && value("role") === "worker" && !form.getAll("managerMapping").length) {
      notify("Select at least one project manager for this worker.");
      return;
    }
    try {
      await apiRequest(editingUser ? `${endpoints[recordDialog]}/${editingUser._id}` : endpoints[recordDialog], sessionToken, {
        method: editingUser ? "PATCH" : "POST",
        body: JSON.stringify(payload),
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
        body: JSON.stringify({ password: resetPassword }),
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
        body: JSON.stringify({ active: nextActive }),
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

  const goTo = (id) => {
    setPage(id);
    setMobileMenu(false);
    setQuery("");
    setCurrentPage(1);
  };

  const visibleNavigation =
    role === "admin"
      ? availableNavigation
      : navigation.filter(item => item.id !== "settings");

  if (page === "login") {
    return <WebLogin error={loginError} onLogin={handleWebLogin} onRegister={handleRegistration} />;
  }

  const groupedNav = [...new Set(visibleNavigation.map((item) => item.group))];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">
            <Building2 size={21} strokeWidth={2.5} />
          </div>
          <div className="brand-copy">
            <strong>BuildFlow</strong>
            <span>CONSTRUCTION OPS</span>
          </div>
          <button
            className="icon-button sidebar-close"
            aria-label="Close menu"
            onClick={() => setMobileMenu(false)}
          >
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
          {groupedNav.map((group) => (
            <div className="nav-group" key={group}>
              <div className="nav-heading">{group}</div>
              {visibleNavigation
                .filter((item) => item.group === group)
                .map(({ id, label, icon: Icon, count }) => (
                  <button
                    key={id}
                    className={`nav-item ${page === id ? "nav-active" : ""}`}
                    onClick={() => goTo(id)}
                  >
                    <Icon size={17} strokeWidth={1.8} />
                    <span>{label}</span>
                    {id === "notifications" && unreadCount > 0
                      ? <span className="nav-count">{unreadCount}</span>
                      : count && <span className="nav-count">{count}</span>}
                  </button>
                ))}
            </div>
          ))}
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
          <button
            className="profile-card"
            onClick={handleLogout}
          >
            <span className="profile-initials">{sessionUser?.name?.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase()}</span>
            <span className="profile-copy">
              <strong>{sessionUser?.name}</strong>
              <span>{role === "admin" ? "Administrator" : "Project manager"}</span>
            </span>
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>

      {mobileMenu && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button menu-toggle"
            aria-label="Open menu"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{pageTitles[page]}</strong>
          </div>
          <label className="global-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search projects, people..."
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="topbar-actions">
            <span className="role-indicator"><ShieldCheck size={14}/>{role === "admin" ? "Administrator" : "Project manager"}</span>
            <button
              className="icon-button top-notification"
              aria-label="Notifications"
              onClick={() => goTo("notifications")}
            >
              <Bell size={19} />
              {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
            </button>
            <span className="top-avatar-initials">{sessionUser?.name?.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase()}</span>
          </div>
        </header>

        <div className="page-content">
          {dataError && <div className="data-error"><span>{dataError}</span><button className="button button-secondary" onClick={() => setRefreshVersion(value => value + 1)}>Retry</button></div>}
          {loading && <div className="loading-strip" role="status">Refreshing records from the database…</div>}
          {page === "overview" ? (
            <Dashboard
              role={role}
              onCreate={() => setDialog(true)}
              onNavigate={goTo}
              projects={projects}
              user={sessionUser}
              dashboardData={dashboardData}
              loading={loading}
              onProjectSelect={setSelectedProject}
            />
          ) : page === "projects" ? (
            <ProjectsPage
              projects={filteredProjects}
              setStatusFilter={updateStatusFilter}
              statusFilter={statusFilter}
              onCreate={() => setDialog(true)}
              notify={notify}
              onProjectSelect={setSelectedProject}
              currentPage={currentPage}
              pageInfo={pageInfo}
              onPageChange={setCurrentPage}
            />
          ) : page === "reports" ? (
            <ReportsPage reportData={reportData} loading={loading} />
          ) : page === "settings" ? (
            <SettingsPage
              settings={settingsData}
              key={JSON.stringify(settingsData)}
              onSave={async (values) => {
                await Promise.all(Object.entries(values).map(([key, value]) =>
                  apiRequest(`/api/settings/${encodeURIComponent(key)}`, sessionToken, {
                    method: "PUT",
                    body: JSON.stringify({ value }),
                  }),
                ));
                setSettingsData(values);
              }}
              notify={notify}
            />
          ) : (
            <ModulePage
              page={page}
              query={query}
              activePeopleFilters={peopleFilters}
              onApplyPeopleFilters={({ search, role: selectedRole, status }) => {
                setPeopleFilters({ role: selectedRole, status });
                updateSearch(search);
              }}
              onClearPeopleFilters={() => {
                setPeopleFilters({ role: "", status: "" });
                updateSearch("");
              }}
              onRefresh={() => setRefreshVersion(version => version + 1)}
              notify={notify}
              rows={records[page] || []}
              onCreate={() => {
                setEditingUser(null);
                setRecordDialog(page);
              }}
              onEditUser={userId => {
                const user = teamMembers.find(member => (member._id || member.id) === userId);
                if (user) {
                  setEditingUser(user);
                  setRecordDialog("users");
                }
              }}
              onViewUserActivity={userId => {
                const user = teamMembers.find(member => (member._id || member.id) === userId);
                if (role === "admin" && user) setActivityPerson(user);
                if (role === "project_manager" && user?.role === "worker" &&
                  isMappedToManager(user, sessionUser?.id || sessionUser?._id || "")) {
                  setActivityPerson(user);
                }
              }}
              canViewUserActivity={userId => {
                const user = teamMembers.find(member => (member._id || member.id) === userId);
                return role === "admin" || (role === "project_manager" && user?.role === "worker" &&
                  isMappedToManager(user, sessionUser?.id || sessionUser?._id || ""));
              }}
              canChangeUserStatus={userId => {
                const user = teamMembers.find(member => (member._id || member.id) === userId);
                if (!user) return false;
                if (role === "admin") {
                  return !(String(userId) === String(sessionUser?.id || sessionUser?._id || "") && user.active);
                }
                return role === "project_manager" && user.role === "worker" &&
                  isMappedToManager(user, sessionUser?.id || sessionUser?._id || "");
              }}
              onChangeUserStatus={userId => {
                const user = teamMembers.find(member => (member._id || member.id) === userId);
                if (user) setStatusChangeUser(user);
              }}
              canEditUsers={role === "admin" || role === "project_manager"}
              currentPage={currentPage}
              pageInfo={pageInfo}
              onPageChange={setCurrentPage}
              onMarkAllRead={async () => {
                try {
                  await apiRequest("/api/notifications/read-all", sessionToken, { method: "PATCH" });
                  setUnreadCount(0);
                  setRefreshVersion(version => version + 1);
                  notify("Notifications marked as read.");
                } catch (error) {
                  notify(error.message);
                }
              }}
            />
          )}
        </div>
      </main>

      {dialog && (
        <ProjectDialog
          onClose={() => setDialog(false)}
          onSubmit={handleCreateProject}
        />
      )}
      {recordDialog && <RecordDialog key={`${recordDialog}-${editingUser?._id || "new"}`} page={recordDialog} role={role} editingUser={editingUser} managerOptions={managerOptions} onClose={() => { setRecordDialog(""); setEditingUser(null); }} onResetPassword={openPasswordReset} onSubmit={handleCreateRecord} />}
      {passwordResetUser && (
        <div className="dialog-backdrop" role="presentation">
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
        </div>
      )}
      {statusChangeUser && (
        <div className="dialog-backdrop" role="presentation">
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
        </div>
      )}
      {selectedProject && <ProjectWorkspaceModal project={selectedProject} token={sessionToken} onClose={() => setSelectedProject(null)} onNavigate={goTo} />}
      {activityPerson && <PersonActivityModal key={activityPerson._id || activityPerson.id} person={activityPerson} token={sessionToken} notify={notify} onClose={() => setActivityPerson(null)} />}
      {toast && (
        <div className="toast">
          <CircleCheck size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}

function WebLogin({ error, onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("resetToken") || "");
  const [forgot, setForgot] = useState(false);
  const [signUp, setSignUp] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setRegistrationError("");
    setRegistrationSuccess("");
    try {
      if (resetToken) {
        if (password.length < 6) throw new Error("Use a password with at least 6 characters.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        const result = await completePasswordReset(resetToken, password);
        setRegistrationSuccess(result.message);
        setResetToken("");
        setPassword("");
        setConfirmPassword("");
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (signUp) {
        if (password.length < 6) throw new Error("Use a password with at least 6 characters.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        const result = await onRegister(name.trim(), email.trim(), password);
        setRegistrationSuccess(result.message || "Your account was created. You can now sign in to the mobile app.");
        setSignUp(false);
        setPassword("");
        setConfirmPassword("");
      } else if (!forgot) {
        await onLogin(email.trim(), password);
      } else {
        setRegistrationSuccess("Password reset is not configured yet. Contact your administrator for help.");
      }
    } catch (submitError) {
      if (signUp || resetToken) setRegistrationError(submitError.message);
      else if (forgot) setRegistrationError("Password reset is not available yet. Contact your administrator.");
    } finally {
      setBusy(false);
    }
  };
  const switchMode = () => {
    setSignUp(value => !value);
    setForgot(false);
    setRegistrationError("");
    setRegistrationSuccess("");
    setConfirmPassword("");
  };
  return (
    <main className="login-screen">
      <div className="login-photo" role="img" aria-label="Modern construction site" />
      <section className="login-panel">
        <div className="login-brand"><span className="brand-mark"><Building2 size={21}/></span><span><strong>BuildFlow</strong><small>CONSTRUCTION OPERATIONS</small></span></div>
        <div className="login-form-wrap">
          <span className="eyebrow">SECURE WORKSPACE</span>
          <h1>{resetToken ? "Choose a new password" : signUp ? "Create your account" : forgot ? "Reset your password" : "Welcome back"}</h1>
          <p>{resetToken ? "Set a new password for your BuildFlow account." : signUp ? "Register a worker account to access BuildFlow field operations." : forgot ? "Enter your work email to request a password reset." : "Sign in to manage projects, crews, and site operations."}</p>
          <form onSubmit={submit}>
            {signUp && <label>Full name<input required autoComplete="name" minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>}
            {!resetToken && <label>Work email<input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" /></label>}
            {!forgot && <label>Password<input required autoComplete={signUp || resetToken ? "new-password" : "current-password"} minLength={signUp || resetToken ? 6 : undefined} maxLength={200} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={signUp || resetToken ? "At least 6 characters" : "Enter your password"} /></label>}
            {(signUp || resetToken) && <label>Confirm password<input required autoComplete="new-password" minLength={6} maxLength={200} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter your password again" /></label>}
            {!signUp && !resetToken && error && <div className="login-error">{error}</div>}
            {registrationError && <div className="login-error" role="alert">{registrationError}</div>}
            {registrationSuccess && <div className="login-notice" role="status">{registrationSuccess}</div>}
            {signUp && <div className="login-notice">Self-registration creates a worker account. Administrator and project-manager access is assigned by an administrator.</div>}
            {forgot && !resetToken && <div className="login-notice">Password reset delivery must be configured by your administrator.</div>}
            <button className="button button-primary login-submit" type="submit" disabled={busy}>{busy ? resetToken ? "Updating password…" : signUp ? "Creating account…" : "Signing in…" : resetToken ? "Set new password" : signUp ? "Create account" : forgot ? "Continue" : "Sign in"}<ArrowRight size={16}/></button>
          </form>
          {!resetToken && !signUp && !forgot && <button className="login-link" onClick={() => setForgot(true)}>Forgot password?</button>}
          {forgot && !resetToken && <button className="login-link" onClick={() => setForgot(false)}>Back to sign in</button>}
          <div className="login-signup-prompt">
            {!resetToken && <><span>{signUp ? "Already have an account?" : "New to BuildFlow?"}</span>
            <button className="login-link" type="button" onClick={switchMode}>{signUp ? "Sign in" : "Create account"}</button></>}
          </div>
        </div>
        <div className="login-footer"><ShieldCheck size={15}/>Authorized access for BuildFlow team members</div>
      </section>
    </main>
  );
}

  function Dashboard({ role, onCreate, onNavigate, projects, onProjectSelect, user, dashboardData }) {
  const isAdmin = role === "admin";
    const [todayLabel] = useState(() => new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
  const summary = dashboardData?.summary || {};
  const projectStatusData = dashboardData?.projectStatus || [];
  const revenueData = (dashboardData?.monthlyRevenue || []).map(({ month, revenue }) => ({
    month: new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: "short" }),
    revenue: revenue / 1000,
  }));
  const attendanceData = (dashboardData?.attendanceTrend || []).map(({ day, workers }) => ({
    day: new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" }),
    workers,
  }));
  const pendingApprovals = dashboardData?.pendingApprovals || [];
  const activities = dashboardData?.activities || [];
  const attendanceRate = summary.activeWorkers
    ? Math.round((summary.attendanceToday / summary.activeWorkers) * 100)
    : 0;
  const activityColors = ["coral", "blue", "green", "amber"];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {todayLabel}
          </div>
          <h1>{isAdmin ? `Good morning, ${user?.name || "there"}` : "Your project portfolio"}</h1>
          <p>
            {isAdmin
              ? "Here’s what’s happening across your construction operations."
              : "A clear view of your sites, crews, and next steps."}
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="button button-secondary"
            onClick={() => onNavigate("reports")}
          >
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
              <AreaChart
                data={revenueData}
                margin={{ top: 8, right: 4, bottom: 0, left: -14 }}
              >
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e87524" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#e87524" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#e9eeec"
                  strokeDasharray="3 4"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8a9697", fontSize: 11 }}
                  tickMargin={12}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8a9697", fontSize: 10 }}
                  tickFormatter={(value) => `$${value}k`}
                />
                <Tooltip
                  formatter={(value) => [`$${value}k`, "Revenue"]}
                  contentStyle={{
                    border: "1px solid #e6ebe8",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#e87524"
                  strokeWidth={2.5}
                  fill="url(#revenueFill)"
                  activeDot={{
                    r: 5,
                    fill: "#e87524",
                    stroke: "#fff",
                    strokeWidth: 3,
                  }}
                />
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
            <button
              className="icon-button small-icon"
              aria-label="Project status options"
            >
              <MoreHorizontal size={19} />
            </button>
          </div>
          <div className="status-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={59}
                  outerRadius={79}
                  paddingAngle={3}
                  stroke="none"
                >
                  {projectStatusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} projects`, name]}
                  contentStyle={{
                    border: "1px solid #e6ebe8",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{summary.totalProjects ?? 0}</strong>
              <span>projects</span>
            </div>
          </div>
          <div className="status-legend">
            {projectStatusData.map((item) => (
              <div key={item.name}>
                <span className="legend-label">
                  <i style={{ background: item.color }} />
                  {item.name}
                </span>
                <strong>{item.value}</strong>
              </div>
            ))}
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
            <button
              className="text-button"
              onClick={() => onNavigate("projects")}
            >
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
            <button
              className="icon-button small-icon"
              aria-label="Attendance options"
            >
              <MoreHorizontal size={19} />
            </button>
          </div>
          <div className="attendance-kpi">
            <strong>{summary.attendanceToday ?? 0}</strong>
            <span>of {summary.activeWorkers ?? 0} active workers checked in today</span>
          </div>
          <div className="attendance-track">
            <span style={{ width: `${attendanceRate}%` }} />
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
              <AreaChart
                data={attendanceData}
                margin={{ top: 6, right: 0, bottom: 0, left: -25 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#edf0ee"
                  strokeDasharray="3 4"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8a9697", fontSize: 9 }}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #e6ebe8",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="workers"
                  stroke="#338264"
                  fill="#338264"
                  fillOpacity={0.08}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <button
            className="attendance-link"
            onClick={() => onNavigate("attendance")}
          >
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
            {pendingApprovals.length ? pendingApprovals.slice(0, 4).map((item, index) => (
              <ApprovalRow
                key={item._id || `${item.project?._id || "approval"}-${index}`}
                title={item.description || `${item.recordType || "Project"} approval`}
                detail={`${item.project?.name || item.project?.projectId || "Project"} · ${item.worker?.name || "Awaiting review"} · ${displayDate(item.createdAt)}`}
                tone={activityColors[index % activityColors.length]}
              />
            )) : <p className="empty-state">No records are waiting for approval.</p>}
          <button
            className="panel-footer-link"
            onClick={() => onNavigate("progress")}
          >
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
            <button
              className="text-button"
              onClick={() => onNavigate("notifications")}
            >
              View all
              <ArrowRight size={15} />
            </button>
          </div>
          {activities.length ? activities.slice(0, 4).map((item, index) => {
            const actor = item.actor?.name || item.actorName || "System";
            const initials = actor.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
            return (
              <ActivityRow
                key={item._id || `${item.title}-${index}`}
                initials={initials}
                color={activityColors[index % activityColors.length]}
                title={item.title || item.action}
                detail={[item.project?.name, item.detail].filter(Boolean).join(" · ")}
                time={displayDate(item.createdAt)}
              />
            );
          }) : <p className="empty-state">No activity has been recorded yet.</p>}
        </section>
      </div>
    </>
  );
}

function ProjectTable({ projects, compact = false, onSelect }) {
  return (
    <div className={`table-wrap ${compact ? "table-compact" : ""}`}>
      <table>
        <thead>
          <tr>
            <th>Project</th>
            <th>Manager</th>
            <th>Schedule</th>
            <th>Progress</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>
                <div className="project-cell">
                  <img
                    src={project.image || "/buildflow.svg"}
                    alt=""
                  />
                  <div>
                    <strong>{project.name}</strong>
                    <span>
                      {project.id} · {project.client}
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <span className="manager-cell">{project.manager}</span>
              </td>
              <td>
                <span className="date-cell">{project.dates}</span>
              </td>
              <td>
                <div className="table-progress">
                  <div>
                    <span style={{ width: `${project.progress}%` }} />
                  </div>
                  <b>{project.progress}%</b>
                </div>
              </td>
              <td>
                <StatusBadge>{project.status}</StatusBadge>
              </td>
              <td>
                <button
                  className="icon-button row-action"
                  aria-label={`More actions for ${project.name}`}
                  onClick={() => onSelect?.(project)}
                >
                  <MoreHorizontal size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const projectTabs = ["Overview", "Assigned worker", "Attendance", "Daily progress", "Photos & documents", "Quotations & invoices", "Activity history"];

function ProjectWorkspaceModal({ project, onClose, onNavigate, token }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [relatedState, setRelatedState] = useState({ key: "", records: null, error: "" });
  const projectKey = String(project._id || project.id);
  const relatedRecords = relatedState.key === projectKey ? relatedState.records : null;
  const relatedError = relatedState.key === projectKey ? relatedState.error : "";

  useEffect(() => {
    const controller = new AbortController();
    const projectId = encodeURIComponent(project.id || project._id);
    Promise.all([
      apiRequest(`/api/attendance?projectId=${projectId}&page=1&limit=10`, token, { signal: controller.signal }),
      apiRequest(`/api/progress?projectId=${projectId}&page=1&limit=10`, token, { signal: controller.signal }),
      apiRequest(`/api/finance?projectId=${projectId}&page=1&limit=10`, token, { signal: controller.signal }),
      apiRequest("/api/dashboard", token, { signal: controller.signal }),
    ]).then(([attendance, progress, finance, dashboard]) => {
      setRelatedState({
        key: projectKey,
        records: {
          attendance: attendance.attendance || [],
          progress: progress.updates || [],
          finance: finance.records || [],
          activities: (dashboard.activities || []).filter(item => String(item.project?._id || item.project) === String(project._id)),
        },
        error: "",
      });
    }).catch(error => {
      if (error.name !== "AbortError") setRelatedState({ key: projectKey, records: null, error: error.message });
    });
    return () => controller.abort();
  }, [project._id, project.id, projectKey, token]);

  const attendanceDetails = (relatedRecords?.attendance || []).map(item =>
    `${item.worker?.name || "Worker"} · ${displayDate(item.checkedInAt)} · ${item.status}${item.checkInLocation ? ` · ${item.checkInLocation.distanceMetres} m` : ""}`,
  );
  const progressDetails = (relatedRecords?.progress || []).map(item =>
    `${item.description} · ${item.worker?.name || "Worker"} · ${item.progress}% · ${item.reviewStatus}`,
  );
  const photoDetails = [
    ...(relatedRecords?.progress || []).flatMap(item => item.photoUrls || []),
    ...(relatedRecords?.attendance || []).flatMap(item => item.workPhotoUrls || []),
  ];
  const financeDetails = (relatedRecords?.finance || []).map(item =>
    `${item.reference} · ${displayMoney(item.total)} · ${item.status}`,
  );
  const activityDetails = (relatedRecords?.activities || []).map(item =>
    `${item.title} · ${item.actor?.name || item.actorName} · ${displayDate(item.createdAt)}`,
  );
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog project-workspace-dialog" role="dialog" aria-modal="true" aria-labelledby="project-workspace-title">
        <div className="project-workspace-heading">
          <div className="project-workspace-photo" style={project.image ? { backgroundImage: `url(${project.image})` } : undefined} />
          <div className="project-workspace-title"><span className="eyebrow">{project.id} · {project.client}</span><h2 id="project-workspace-title">{project.name}</h2><span className="project-workspace-meta">{project.manager} · {project.dates}</span></div>
          <StatusBadge>{project.status}</StatusBadge>
          <button className="icon-button" onClick={onClose} aria-label="Close project workspace"><X size={19}/></button>
        </div>
        <div className="project-tab-strip" role="tablist" aria-label="Project sections">
          {projectTabs.map((tab) => <button key={tab} role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "project-tab-active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}
        </div>
        <div className="project-workspace-content">
          {activeTab === "Overview" ? <div className="project-overview-grid"><div className="project-overview-main"><div className="project-progress-head"><div><span>Overall completion</span><strong>{project.progress}%</strong></div><StatusBadge>{project.status}</StatusBadge></div><div className="project-overview-track"><span style={{ width: `${project.progress}%` }}/></div><div className="project-details-kpis"><div><span>Contract budget</span><strong>{displayMoney(project.budget)}</strong></div><div><span>Assigned crew</span><strong>{project.crew}</strong></div><div><span>Project manager</span><strong>{project.manager}</strong></div></div><div className="project-timeline"><h3>Project schedule</h3><div><i className="timeline-complete"/><span><strong>Start</strong><small>{project.startDate ? displayDate(project.startDate) : "Not scheduled"}</small></span><time>{project.priority || "standard"} priority</time></div><div><i className={project.progress > 0 ? "timeline-complete" : ""}/><span><strong>Completion target</strong><small>{project.endDate ? displayDate(project.endDate) : "Not scheduled"}</small></span><time>{project.progress}%</time></div></div></div><aside className="project-location-panel"><div className="project-mini-map"><MapPin size={23}/></div><span className="eyebrow">SITE LOCATION</span><strong>{project.address || "Location coordinates pending"}</strong><p>Attendance boundary · {project.location?.radiusMetres || "—"} m</p><button className="button button-secondary" onClick={() => onNavigate("attendance")}><Clock3 size={15}/>View attendance</button></aside></div>
            : activeTab === "Assigned worker" ? <ModuleRecordView title="Assigned crew" details={[project.crew, project.manager].filter(Boolean)} />
              : activeTab === "Attendance" ? <ModuleRecordView title="Recent attendance" details={attendanceDetails} />
                : activeTab === "Daily progress" ? <ModuleRecordView title="Progress timeline" details={progressDetails} />
                  : activeTab === "Photos & documents" ? <ModuleRecordView title="Uploaded site photos" details={photoDetails} />
                    : activeTab === "Quotations & invoices" ? <ModuleRecordView title="Project finances" details={financeDetails} />
                      : <ModuleRecordView title="Activity history" details={activityDetails} />}
          {relatedError && <div className="data-error" role="alert">{relatedError}</div>}
          {!relatedRecords && !relatedError && <div className="loading-strip" role="status">Loading project records…</div>}
        </div>
      </section>
    </div>
  );
}

function ModuleRecordView({ title, details }) {
  return <section className="project-record-view"><div className="panel-heading"><div><h2>{title}</h2><p>Latest records for this project</p></div></div>{details.length ? details.map((detail, index) => <div className="project-record-row" key={`${detail}-${index}`}><span className={`project-record-icon ${index === 0 ? "record-icon-orange" : ""}`}><FileText size={17}/></span><span>{detail}</span><ArrowUpRight size={15}/></div>) : <p className="empty-state">No records are available for this project.</p>}</section>;
}

function PaginationControls({ pageInfo, currentPage, onPageChange }) {
  const pages = Math.max(1, pageInfo?.pages || 1);
  return (
    <div className="table-pagination">
      <span>
        Showing page <strong>{currentPage}</strong> of {pages}
        {pageInfo?.total != null && <> · {pageInfo.total} records</>}
      </span>
      <div>
        <button disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>Previous</button>
        <span className="page-current">{currentPage}</span>
        <button disabled={currentPage >= pages} onClick={() => onPageChange(currentPage + 1)}>Next</button>
      </div>
    </div>
  );
}

function ProjectsPage({
  projects,
  setStatusFilter,
  statusFilter,
  onCreate,
  notify,
  onProjectSelect,
  currentPage,
  pageInfo,
  onPageChange,
}) {
  const portfolioBudget = projects.reduce((total, project) => total + (Number(project.budget) || 0), 0);
  const completed = projects.filter(project => ["Completed", "Closed"].includes(project.status)).length;
  const awaitingCrew = projects.filter(project => project.status === "Open").length;
  return (
    <>
      <PageHeading
        title="Projects"
        description="Track delivery, crews, budgets, and milestones across your portfolio."
        action={
          <button className="button button-primary" onClick={onCreate}>
            <Plus size={17} />
            Create project
          </button>
        }
      />
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
            <button
              className={statusFilter === "All statuses" ? "filter-active" : ""}
              onClick={() => setStatusFilter("All statuses")}
            >
              All projects <span>{projects.length}</span>
            </button>
            <button
              className={statusFilter === "In progress" ? "filter-active" : ""}
              onClick={() => setStatusFilter("In progress")}
            >
              In progress
            </button>
            <button
              className={
                statusFilter === "Awaiting crew" ? "filter-active" : ""
              }
              onClick={() => setStatusFilter("Awaiting crew")}
            >
              Awaiting crew
            </button>
            <button
              className={statusFilter === "Completed" ? "filter-active" : ""}
              onClick={() => setStatusFilter("Completed")}
            >
              Completed
            </button>
          </div>
          <div className="toolbar-actions">
            <label className="select-filter">
              <Filter size={15} />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option>All statuses</option>
                <option>In progress</option>
                <option>Awaiting crew</option>
                <option>Completed</option>
                <option>Draft</option>
              </select>
              <ChevronDown size={13} />
            </label>
            <button
              className="button button-secondary"
              onClick={() => notify("Project data export prepared.")}
            >
              <ArrowDownToLine size={16} />
              Export
            </button>
          </div>
        </div>
        <ProjectTable projects={projects} onSelect={onProjectSelect} />
        <PaginationControls pageInfo={pageInfo} currentPage={currentPage} onPageChange={onPageChange} />
      </div>
    </>
  );
}

function PageHeading({ title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">CONSTRUCTION OPERATIONS</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{action}</div>
    </div>
  );
}

function ModulePage({ page, query, activePeopleFilters = { role: "", status: "" }, onApplyPeopleFilters, onClearPeopleFilters, onRefresh, notify, onCreate, onEditUser, onViewUserActivity, onChangeUserStatus, canEditUsers, canViewUserActivity, canChangeUserStatus, rows = [], currentPage, pageInfo, onPageChange, onMarkAllRead }) {
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
      if (rowMenu && !rowMenuRef.current?.contains(event.target) &&
        !rowMenuTriggerRef.current?.contains(event.target)) setRowMenu(null);
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

  const filteredRows = rows.filter((row) =>
    row.join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  const totalPeople = page === "users" ? pageInfo?.total ?? filteredRows.length : filteredRows.length;
  const actionLabel =
    {
      users: "Invite user",
      clients: "Add client",
      assignment: "Create assignment",
      attendance: "Export log",
      progress: "Review updates",
      quotations: "New quotation",
      invoices: "Create invoice",
      payments: "Record payment",
      expenses: "Add expense",
      notifications: "Mark all read",
    }[page] || "Create new";
  const headers = columnSets[page] || ["Name", "Details", "Updated", "Status"];
  const action =
    page === "projects" ? null : (
      <button
        className="button button-primary"
        onClick={() => page === "notifications" ? onMarkAllRead?.() : ["assignment", "attendance", "progress"].includes(page) ? notify(`${pageTitles[page]} opened for review.`) : onCreate()}
      >
        {page === "notifications" ? <Check size={17} /> : <Plus size={17} />}
        {actionLabel}
      </button>
    );
  return (
    <>
      <PageHeading
        title={pageTitles[page]}
        description={
          pageDescriptions[page] ||
          "Manage your construction operations and team workspace."
        }
        action={action}
      />
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
      {page === "assignment" && (
        <div className="assignment-banner">
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
        </div>
      )}
      {page === "attendance" && (
        <div className="verification-banner">
          <MapPin size={18} />
          <span>
            GPS radius is enforced at 100 m. Location verification cannot be
            manually overridden.
          </span>
          <StatusBadge>GPS required</StatusBadge>
        </div>
      )}
      {page === "invoices" && (
        <div className="finance-summary">
          <strong>
            Payments received this month <b>$124,800</b>
          </strong>
          <strong>
            Due in 7 days <b>$68,400</b>
          </strong>
          <strong>
            Past due <b className="red-copy">$18,600</b>
          </strong>
        </div>
      )}
      <div className="panel table-panel module-table">
        <div className="list-toolbar">
          <div className="table-heading-copy">
            <strong>
              {page === "notifications"
                ? "Latest updates"
                : `All ${pageTitles[page]?.toLowerCase()}`}
            </strong>
            <span>{totalPeople} records in this view</span>
          </div>
          <div className="toolbar-actions">
            <button
              className="button button-secondary"
              aria-expanded={filtersOpen}
              aria-controls={page === "users" ? "people-filter-panel" : undefined}
              onClick={() => {
                if (page === "users") {
                  setDraftSearch(query);
                  setDraftRole(activePeopleFilters.role);
                  setDraftStatus(activePeopleFilters.status);
                  setFiltersOpen(open => !open);
                } else {
                  notify("Filters applied to this view.");
                }
              }}
            >
              <Filter size={15} />
              Filters
            </button>
            <div className="module-toolbar-menu" ref={toolbarRef}>
              <button
                className="icon-button small-icon"
                onClick={() => page === "users" ? setOptionsOpen(open => !open) : notify("View options opened.")}
                aria-label={page === "users" ? "More list actions" : "View options"}
                aria-expanded={page === "users" ? optionsOpen : undefined}
              >
                <MoreHorizontal size={19} />
              </button>
              {page === "users" && optionsOpen && (
                <div className="module-toolbar-dropdown" role="menu">
                  {page === "users" && (
                    <button type="button" role="menuitem" onClick={() => {
                      setOptionsOpen(false);
                      onClearPeopleFilters?.();
                      setFiltersOpen(false);
                    }}>Clear filters</button>
                  )}
                  <button type="button" role="menuitem" onClick={() => {
                    setOptionsOpen(false);
                    onRefresh?.();
                  }}>Refresh list</button>
                </div>
              )}
            </div>
          </div>
        </div>
        {page === "users" && filtersOpen && (
          <form
            id="people-filter-panel"
            className="people-filter-panel"
            onSubmit={event => {
              event.preventDefault();
              onApplyPeopleFilters?.({ search: draftSearch, role: draftRole, status: draftStatus });
              setFiltersOpen(false);
            }}
          >
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
          </form>
        )}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={`${page}-${row[0]}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${cell}-${cellIndex}`}>
                      {(page === "users" ? cellIndex === 3 : cellIndex === row.length - 1) &&
                      [
                        "users",
                        "assignment",
                        "attendance",
                        "progress",
                        "quotations",
                        "invoices",
                        "payments",
                        "expenses",
                      ].includes(page) ? (
                        <StatusBadge>{cell}</StatusBadge>
                      ) : page === "users" && cellIndex === 0 && canViewUserActivity?.(row.userId) ? (
                        <button className="person-name-link" type="button" onClick={() => onViewUserActivity?.(row.userId)}>{cell}</button>
                      ) : (
                        <span className={cellIndex === 0 ? "strong-cell" : ""}>
                          {cell}
                        </span>
                      )}
                    </td>
                  ))}
                  <td>
                    {page === "users" ? (
                      <button
                        className="icon-button row-action"
                        aria-label={`More actions for ${row[0]}`}
                        aria-haspopup="menu"
                        aria-expanded={rowMenu?.userId === row.userId}
                        onClick={event => {
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
                            top: Math.min(rect.bottom + 4, window.innerHeight - 110),
                          });
                        }}
                      >
                        <MoreHorizontal size={17} />
                      </button>
                    ) : (
                      <button
                        className="icon-button row-action"
                        aria-label={`Open ${row[0]}`}
                        onClick={() => notify(`${row[0]} details opened.`)}
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rowMenu && page === "users" && createPortal(
          <div
            className="people-row-menu"
            role="menu"
            ref={rowMenuRef}
            style={{ left: rowMenu.left, top: rowMenu.top }}
            onPointerDown={event => event.stopPropagation()}
          >
            {canEditUsers && (
              <button type="button" role="menuitem" onClick={() => {
                setRowMenu(null);
                onEditUser?.(rowMenu.userId);
              }}>
                <Pencil size={14} /> Edit team member
              </button>
            )}
            {canViewUserActivity?.(rowMenu.userId) && (
              <button type="button" role="menuitem" onClick={() => {
                setRowMenu(null);
                onViewUserActivity?.(rowMenu.userId);
              }}>
                <Activity size={14} /> View activity logs
              </button>
            )}
            {canChangeUserStatus?.(rowMenu.userId) && (
              <button type="button" role="menuitem" onClick={() => {
                setRowMenu(null);
                onChangeUserStatus?.(rowMenu.userId);
              }}>
                <CircleCheck size={14} /> Change Status
              </button>
            )}
          </div>,
          document.body,
        )}
        <PaginationControls pageInfo={pageInfo} currentPage={currentPage} onPageChange={onPageChange} />
      </div>
    </>
  );
}

function PersonActivityModal({ person, token, notify, onClose }) {
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
    const params = new URLSearchParams({ page: String(currentPage), limit: "25" });
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (activityType) params.set("type", activityType);
    apiRequest(`/api/users/${encodeURIComponent(person._id || person.id)}/activity?${params}`, token, { signal: controller.signal })
      .then(result => {
        setActivities(result.activities || []);
        setPageInfo(result.pagination || null);
        setError("");
      })
      .catch(loadError => {
        if (loadError.name !== "AbortError") setError(loadError.message);
      })
      .finally(() => {
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
        headers: { Authorization: `Bearer ${token}` },
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

  return (
    <div className="dialog-backdrop" role="presentation">
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
        {!loading && !visibleError && activities.length === 0 && (
          <div className="activity-log-empty">No activity logs are available for {person.name} with the selected filters.</div>
        )}
        {!loading && !visibleError && activities.length > 0 && (
          <div className="table-wrap activity-log-table">
            <table>
              <thead>
                <tr><th>Date &amp; Time</th><th>Person Name</th><th>Action</th><th>Description</th><th>IP / Device</th><th>Status</th></tr>
              </thead>
              <tbody>
                {activities.map(activity => (
                  <tr key={activity.id}>
                    <td>{new Date(activity.dateTime).toLocaleString()}</td>
                    <td>{activity.personName || person.name}</td>
                    <td>{activity.action}</td>
                    <td>{activity.description || "—"}</td>
                    <td>{[activity.ipAddress, activity.deviceInfo].filter(Boolean).join(" · ") || "—"}</td>
                    <td><StatusBadge>{activity.status}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationControls pageInfo={pageInfo} currentPage={currentPage} onPageChange={setCurrentPage} />
      </section>
    </div>
  );
}

const recordDialogFields = {
  users: [
    { name: "name", label: "Full name", required: true },
    { name: "email", label: "Work email", type: "email", required: true },
    { name: "role", label: "System role", type: "select", options: [["worker", "Worker"], ["project_manager", "Project manager"], ["admin", "Admin"]] },
    { name: "managerMapping", label: "Manager Mapping", type: "manager", required: true },
    { name: "password", label: "Temporary password (6+ characters)", type: "password", minLength: 6, required: true },
  ],
  clients: [
    { name: "name", label: "Client or organization", required: true },
    { name: "contactName", label: "Primary contact", required: true },
    { name: "email", label: "Contact email", type: "email" },
    { name: "phone", label: "Contact phone", type: "tel" },
  ],
  quotations: [
    { name: "client", label: "Client", required: true },
    { name: "project", label: "Project reference", required: true },
    { name: "item", label: "Item description", required: true, wide: true },
    { name: "labour", label: "Labour charges", type: "number", min: 0, defaultValue: "0" },
    { name: "materials", label: "Material charges", type: "number", min: 0, defaultValue: "0" },
    { name: "quantity", label: "Quantity", type: "number", min: 0, defaultValue: "1" },
    { name: "unitPrice", label: "Unit price", type: "number", min: 0, defaultValue: "0" },
    { name: "tax", label: "Tax rate (%)", type: "number", min: 0, defaultValue: "0" },
    { name: "discount", label: "Discount amount", type: "number", min: 0, defaultValue: "0" },
    { name: "validUntil", label: "Valid until", type: "date", required: true },
  ],
  invoices: [
    { name: "client", label: "Client", required: true },
    { name: "project", label: "Project reference", required: true },
    { name: "invoiceDate", label: "Invoice date", type: "date", required: true },
    { name: "dueDate", label: "Due date", type: "date", required: true },
    { name: "item", label: "Line item description", required: true, wide: true },
    { name: "labour", label: "Labour charges", type: "number", min: 0, defaultValue: "0" },
    { name: "materials", label: "Material charges", type: "number", min: 0, defaultValue: "0" },
    { name: "quantity", label: "Quantity", type: "number", min: 0, defaultValue: "1" },
    { name: "unitPrice", label: "Unit price", type: "number", min: 0, defaultValue: "0" },
    { name: "tax", label: "Tax rate (%)", type: "number", min: 0, defaultValue: "0" },
    { name: "discount", label: "Discount amount", type: "number", min: 0, defaultValue: "0" },
  ],
  payments: [
    { name: "client", label: "Client", required: true },
    { name: "invoice", label: "Invoice reference", required: true },
    { name: "project", label: "Project ID", required: true, placeholder: "BLD-2408" },
    { name: "date", label: "Payment date", type: "date", required: true },
    { name: "method", label: "Payment method", type: "select", options: [["ACH transfer", "ACH transfer"], ["Wire transfer", "Wire transfer"], ["Check", "Check"], ["Card", "Card"], ["Cash", "Cash"]] },
    { name: "reference", label: "Transaction reference", placeholder: "Optional" },
    { name: "amount", label: "Amount received", type: "number", min: 0.01, step: "0.01", required: true },
    { name: "status", label: "Payment status", type: "select", options: [["Pending", "Pending"], ["Partially Paid", "Partially Paid"], ["Paid", "Paid"], ["Cancelled", "Cancelled"]] },
  ],
  expenses: [
    { name: "client", label: "Client", required: true },
    { name: "description", label: "Expense description", required: true, wide: true },
    { name: "category", label: "Category", type: "select", options: [["Materials", "Materials"], ["Labor", "Labor"], ["Equipment", "Equipment"], ["Safety", "Safety"], ["Travel", "Travel"], ["Other", "Other"]] },
    { name: "project", label: "Project ID", required: true, placeholder: "BLD-2408" },
    { name: "date", label: "Expense date", type: "date", required: true },
    { name: "amount", label: "Amount", type: "number", min: 0.01, step: "0.01", required: true },
    { name: "receipt", label: "Receipt URL", type: "url", placeholder: "Optional" },
  ],
};

const recordDialogTitles = {
  users: "Invite a team member", clients: "Add a client", quotations: "Create a quotation",
  invoices: "Create an invoice", payments: "Record a payment", expenses: "Add an expense",
};

function RecordDialog({ page, role, editingUser, managerOptions, onClose, onResetPassword, onSubmit }) {
  const [selectedRole, setSelectedRole] = useState(editingUser?.role || "worker");
  const currentManagers = managerList(editingUser?.managerMapping);
  const [selectedManagerIds, setSelectedManagerIds] = useState(() => currentManagers.map(manager => String(manager?._id || manager?.id || manager)).filter(Boolean));
  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
  const fields = (recordDialogFields[page] || [])
    .filter(field => !(editingUser && field.name === "password"))
    .filter(field => !(editingUser && role !== "admin" && field.name === "role"))
    .filter(field => field.name !== "managerMapping" || (role === "admin" && selectedRole === "worker"))
    .map(field => {
    if (page !== "users" || field.name !== "role" || role === "admin") return field;
    return { ...field, options: field.options.filter(([value]) => value === "worker") };
  });
  const availableManagers = managerOptions || [];
  const managerOptionsForSelect = [
    ...currentManagers,
    ...availableManagers.filter(manager => !currentManagers.some(current =>
      String(current?._id || current?.id || current) === String(manager._id || manager.id))),
  ];
  const selectedManagers = selectedManagerIds.map(id => managerOptionsForSelect.find(manager =>
    String(manager?._id || manager?.id || manager) === id)).filter(Boolean);
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog record-dialog" role="dialog" aria-modal="true" aria-labelledby="record-dialog-title">
        <div className="dialog-heading">
          <div><span className="eyebrow">{pageTitles[page]?.toUpperCase()}</span><h2 id="record-dialog-title">{editingUser ? "Edit team member" : recordDialogTitles[page]}</h2><p>{editingUser ? "Update this team member's account and manager mapping." : "Complete the details to add this record to the workspace."}</p></div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19}/></button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="record-fields">
            {fields.map((field) => {
              const FieldWrapper = field.type === "manager" ? "div" : "label";
              return (
              <FieldWrapper className={`${field.wide ? "record-field-wide " : ""}${field.type === "manager" ? "manager-field" : ""}`} key={field.name}>
                {field.type === "manager"
                  ? <span className="manager-field-label">{field.label} <span aria-hidden="true">*</span></span>
                  : field.label}
                {field.type === "manager" ? (
                  <div className="manager-multiselect" aria-required="true" aria-label="Manager Mapping, required">
                    <div className="manager-selection">
                      {selectedManagers.map(manager => {
                        const id = String(manager?._id || manager?.id || manager);
                        return (
                          <span className="manager-selection-chip" key={id}>
                            {manager.name || manager.email || "Project manager"}
                            <button type="button" aria-label={`Remove ${manager.name || manager.email} mapping`} onClick={() => setSelectedManagerIds(ids => ids.filter(selectedId => selectedId !== id))}><X size={13} /></button>
                          </span>
                        );
                      })}
                      <button
                        type="button"
                        className="manager-dropdown-trigger"
                        aria-haspopup="listbox"
                        aria-expanded={managerDropdownOpen}
                        onClick={() => setManagerDropdownOpen(open => !open)}
                      >
                        {selectedManagers.length ? "Add a Project Manager" : "Select Project Managers"}
                        <ChevronDown size={15} />
                      </button>
                    </div>
                    {managerDropdownOpen && (
                      <div className="manager-dropdown-options" role="group" aria-label="Available Project Managers">
                        {managerOptionsForSelect.map(manager => {
                          const id = String(manager?._id || manager?.id || manager);
                          const selected = selectedManagerIds.includes(id);
                          return (
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={selected}
                              className="manager-dropdown-option"
                              key={id}
                              onClick={() => setSelectedManagerIds(ids =>
                                  selected ? ids.filter(selectedId => selectedId !== id) : [...ids, id])}
                            >
                              <span className={`manager-option-check ${selected ? "manager-option-selected" : ""}`} aria-hidden="true">{selected ? <Check size={12} /> : null}</span>
                              <span>{manager.name || manager.email} {manager.email && manager.name ? `(${manager.email})` : ""}</span>
                            </button>
                          );
                        })}
                        {!managerOptionsForSelect.length && <span className="manager-dropdown-empty">No project managers available.</span>}
                      </div>
                    )}
                    {selectedManagerIds.map(id => <input key={id} type="hidden" name={field.name} value={id} />)}
                  </div>
                ) : field.type === "select" ? (
                  <select
                    name={field.name}
                    required={field.required}
                    value={field.name === "role" ? selectedRole : undefined}
                    defaultValue={field.name === "role" ? undefined : editingUser?.[field.name] || field.options?.[0]?.[0]}
                    onChange={field.name === "role" ? event => setSelectedRole(event.target.value) : undefined}
                  >
                    {field.options?.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                ) : (
                  <input
                    name={field.name}
                    type={field.type || "text"}
                    min={field.min}
                    minLength={field.minLength}
                    step={field.step}
                    placeholder={field.placeholder}
                    defaultValue={editingUser?.[field.name] ?? field.defaultValue}
                    required={field.required}
                  />
                )}
              </FieldWrapper>
            );})}
          </div>
          {(page === "quotations" || page === "invoices") && <div className="record-note"><CircleDollarSign size={16}/><span>Subtotal combines labour, materials, and quantity × unit price. Tax and discount are then applied.</span></div>}
          <div className="dialog-actions">
            {editingUser && <button type="button" className="button button-secondary" onClick={() => onResetPassword?.(editingUser)}>Reset Password</button>}
            <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-primary"><Check size={16}/>{editingUser ? "Save changes" : page === "users" ? "Send invite" : "Save record"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ReportsPage({ reportData, loading }) {
  const projects = reportData?.projects?.rows || [];
  const finance = reportData?.finance?.rows || [];
  const attendance = reportData?.attendance?.rows || [];
  const payments = finance.filter(record => record.recordType === "payment");
  const revenueByMonth = Object.entries(payments.reduce((groups, payment) => {
    const paidAt = payment.paidAt || payment.createdAt;
    if (!paidAt) return groups;
    const date = new Date(paidAt);
    if (Number.isNaN(date.getTime())) return groups;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    groups[key] ||= { month: date.toLocaleDateString(undefined, { month: "short" }), revenue: 0 };
    groups[key].revenue += Number(payment.amountReceived) || 0;
    return groups;
  }, {})).sort(([a], [b]) => a.localeCompare(b)).map(([, monthData]) => monthData);
  const completion = projects.length
    ? projects.reduce((total, project) => total + (Number(project.progress) || 0), 0) / projects.length
    : 0;
  const totalCheckIns = attendance.reduce((total, item) => total + (Number(item.checkIns) || 0), 0);
  const completedShifts = attendance.reduce((total, item) => total + (Number(item.completedShifts) || 0), 0);
  const revenue = payments.reduce((total, item) => total + (Number(item.amountReceived) || 0), 0);
  return (
    <>
      <PageHeading
        title="Reports & analytics"
        description="See project delivery, workforce coverage, and financial performance."
        action={
          <button className="button button-secondary">
            <CalendarDays size={16} />
            Oct 01 – Oct 16
            <ChevronDown size={14} />
          </button>
        }
      />
      <div className="report-grid">
        <div className="panel report-card">
          <span>Project completion</span>
          <strong>{completion.toFixed(1)}%</strong>
          <small>{projects.length} projects in the database</small>
          <div className="report-bar">
            <span style={{ width: `${Math.min(100, completion)}%` }} />
          </div>
        </div>
        <div className="panel report-card">
          <span>Completed shifts</span>
          <strong>{totalCheckIns ? `${Math.round(completedShifts / totalCheckIns * 100)}%` : "0%"}</strong>
          <small>{completedShifts} of {totalCheckIns} recorded check-ins completed</small>
          <div className="report-bar green-bar">
            <span style={{ width: `${totalCheckIns ? Math.min(100, completedShifts / totalCheckIns * 100) : 0}%` }} />
          </div>
        </div>
        <div className="panel report-card">
          <span>Revenue collected</span>
          <strong>{displayMoney(revenue)}</strong>
          <small>{payments.length} recorded payment transactions</small>
          <div className="report-bar blue-bar">
            <span style={{ width: `${revenue ? 100 : 0}%` }} />
          </div>
        </div>
      </div>
      <div className="panel report-chart-panel">
        <div className="panel-heading">
          <div>
            <h2>Revenue trend</h2>
            <p>Monthly recognized revenue · USD</p>
          </div>
          <button className="button button-secondary">
            <ArrowDownToLine size={16} />
            Export report
          </button>
        </div>
        <div className="chart-area report-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueByMonth}>
              <defs>
                <linearGradient id="reportFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e87524" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#e87524" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="#e9eeec"
                strokeDasharray="3 4"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8a9697", fontSize: 11 }}
                tickMargin={12}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8a9697", fontSize: 10 }}
                tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
              />
              <Tooltip formatter={(value) => [displayMoney(value), "Revenue"]} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#e87524"
                strokeWidth={2.5}
                fill="url(#reportFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {!loading && !reportData && <p className="empty-state">No report data is available.</p>}
      </div>
    </>
  );
}

function SettingsPage({ settings, onSave, notify }) {
  const profile = settings["workspace.profile"] || {};
  const [values, setValues] = useState(() => ({
    companyName: profile.companyName ?? settings["workspace.companyName"] ?? "",
    primaryContact: profile.primaryContact ?? settings["workspace.primaryContact"] ?? "",
    businessEmail: profile.businessEmail ?? settings["workspace.businessEmail"] ?? "",
    attendanceRadius: profile.attendanceRadius ?? settings["workspace.attendanceRadius"] ?? "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        "workspace.profile": {
          companyName: values.companyName,
          primaryContact: values.primaryContact,
          businessEmail: values.businessEmail,
          attendanceRadius: values.attendanceRadius ? Number(values.attendanceRadius) : "",
        },
      });
      notify("Workspace settings saved.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeading
        title="Settings & access"
        description="Manage workspace identity, role boundaries, and notification preferences."
        action={
          <button className="button button-primary" type="submit" form="workspace-settings" disabled={saving}>
            <Check size={16} />{saving ? "Saving…" : "Save changes"}
          </button>
        }
      />
      <div className="settings-layout">
        <div className="panel settings-nav">
          <button className="settings-active">
            <Building2 size={17} />
            Workspace profile
          </button>
          <button>
            <ShieldCheck size={17} />
            Roles & permissions
          </button>
          <button>
            <Bell size={17} />
            Notifications
          </button>
          <button>
            <Users size={17} />
            Team access
          </button>
        </div>
        <form className="panel settings-form" id="workspace-settings" onSubmit={save}>
          <h2>Workspace profile</h2>
          <p>
            Company details used across project records and client documents.
          </p>
          <label>
            Company name
            <input value={values.companyName} onChange={event => setValues(current => ({ ...current, companyName: event.target.value }))} />
          </label>
          <div className="settings-form-row">
            <label>
              Primary contact
              <input value={values.primaryContact} onChange={event => setValues(current => ({ ...current, primaryContact: event.target.value }))} />
            </label>
            <label>
              Business email
              <input type="email" value={values.businessEmail} onChange={event => setValues(current => ({ ...current, businessEmail: event.target.value }))} />
            </label>
          </div>
          <label>
            Default attendance radius
            <div className="input-suffix">
              <input type="number" min="1" max="1000" value={values.attendanceRadius} onChange={event => setValues(current => ({ ...current, attendanceRadius: event.target.value }))} />
              <span>metres</span>
            </div>
          </label>
          <div className="settings-note">
            <ShieldCheck size={17} />
            <span>
              GPS attendance and break limits are verified by the server, not
              these display preferences.
            </span>
          </div>
          {error && <div className="data-error" role="alert">{error}</div>}
        </form>
      </div>
    </>
  );
}

function ApprovalRow({ title, detail, tone }) {
  return (
    <div className="approval-row">
      <div className={`approval-icon ${tone}`}>
        <FileText size={16} />
      </div>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <button className="review-button">Review</button>
    </div>
  );
}

function ActivityRow({ initials, color, title, detail, time }) {
  return (
    <div className="activity-row">
      <div className={`activity-avatar ${color}`}>{initials}</div>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <time>{time}</time>
    </div>
  );
}

function ProjectDialog({ onClose, onSubmit }) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState(100);
  const hasLocation = latitude !== "" && longitude !== "";
  const mapCenter = [Number(latitude) || 37.7895, Number(longitude) || -122.4012];
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">PROJECT SETUP</span>
            <h2 id="dialog-title">Create a project</h2>
            <p>Start a new site record for your team and client.</p>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={19} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <label>
            Project name
            <input
              name="projectName"
              placeholder="e.g. Harbor Point Residences"
              required
              autoFocus
            />
          </label>
          <label>
            Client name
            <input name="clientName" placeholder="Client or organization" required />
          </label>
          <div className="form-row">
            <label>Client contact<input name="contactName" placeholder="Contact name" /></label>
            <label>Contact email<input name="contactEmail" type="email" placeholder="client@company.com" /></label>
          </div>
          <label>Contact phone<input name="contactPhone" type="tel" placeholder="(555) 000-0000" /></label>
          <label>
            Project address
            <input
              name="address"
              placeholder="Street address, city, state"
              required
            />
          </label>
          <label>Project description<textarea name="description" rows="3" placeholder="Scope, instructions, or site requirements" /></label>
          <div className="site-coordinate-grid">
            <MapContainer className="site-map" center={mapCenter} zoom={14} scrollWheelZoom={false}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationClickHandler onSelect={(point) => { setLatitude(point.latitude); setLongitude(point.longitude); }} />
              {hasLocation && <Circle center={mapCenter} radius={Number(radius) || 100} pathOptions={{ color: "#e87524", fillColor: "#e87524", fillOpacity: 0.12 }} />}
              {hasLocation && <CircleMarker center={mapCenter} radius={7} pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#e87524", fillOpacity: 1 }} />}
            </MapContainer>
            <div className="site-coordinate-fields">
              <label>GPS latitude<input name="latitude" type="number" min="-90" max="90" step="any" placeholder="Click the map to set" value={latitude} onChange={(event) => setLatitude(event.target.value)} required /></label>
              <label>GPS longitude<input name="longitude" type="number" min="-180" max="180" step="any" placeholder="Click the map to set" value={longitude} onChange={(event) => setLongitude(event.target.value)} required /></label>
              <label>Attendance radius<div className="input-suffix"><input name="radiusMetres" type="number" min="1" max="1000" value={radius} onChange={(event) => setRadius(event.target.value)} required /><span>metres</span></div></label>
            </div>
          </div>
          <div className="form-row">
            <label>
              Estimated start
              <input name="startDate" type="date" required />
            </label>
            <label>
              Estimated finish
              <input name="endDate" type="date" required />
            </label>
          </div>
          <div className="form-row">
            <label>
              Budget
              <input name="budget" type="number" min="0" step="0.01" placeholder="0.00" inputMode="decimal" />
            </label>
            <label>
              Priority
              <select name="priority" defaultValue="standard">
                <option value="low">Low</option>
                <option value="standard">Standard</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
          </div>
          <label>Project document links<input name="attachments" placeholder="Optional document URLs, separated by commas" /></label>
          <div className="location-note">
            <MapPin size={17} />
            <span>
              Attendance check-in is limited to the configured radius. The site coordinates are verified by the server on every check-in.
            </span>
          </div>
          <div className="dialog-actions">
            <button
              type="button"
              className="button button-secondary"
              name="saveDraft"
              value="true"
              onClick={(event) => {
                const form = event.currentTarget.closest("form");
                const draft = document.createElement("input");
                draft.type = "hidden";
                draft.name = "saveDraft";
                draft.value = "true";
                form.appendChild(draft);
                form.requestSubmit();
              }}
            >
              Save as draft
            </button>
            <button type="submit" className="button button-primary">
              <Plus size={16} />
              Create project
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function LocationClickHandler({ onSelect }) {
  useMapEvents({ click: (event) => onSelect({ latitude: event.latlng.lat, longitude: event.latlng.lng }) });
  return null;
}

function WorkerWorkspace({ tab, setTab, onRoleChange, isPreview, onLogout, notify, toast }) {
  const breakStarted = false;
  const checkedIn = false;
  const workerTabs = [
    { label: "Home", icon: LayoutDashboard },
    { label: "Projects", icon: Building2 },
    { label: "Attendance", icon: Clock3 },
    { label: "Alerts", icon: Bell },
    { label: "Profile", icon: Users },
  ];
  const action = checkedIn
    ? breakStarted
      ? "Resume work"
      : "Start break"
    : "Verify & check in";
  const handleMainAction = () => {
    if (!checkedIn) {
      notify(
        "Live GPS and selfie verification are required. Attendance was not recorded.",
      );
      setTab("Attendance");
    } else if (breakStarted) {
      notify("Break completion requires the server attendance service.");
    } else {
      notify(
        "A server-authorized break must be started before the timer begins.",
      );
    }
  };
  return (
    <div className="worker-shell">
      <header className="worker-topbar">
        <div className="worker-brand">
          <div className="brand-mark">
            <Building2 size={20} />
          </div>
          <strong>BuildFlow</strong>
        </div>
        <label className="role-select-label">
          <span>Role</span>
          <select
            value="worker"
            disabled={!isPreview}
            onChange={(event) => onRoleChange(event.target.value)}
          >
            <option value="worker">Worker</option>
            <option value="admin">Admin</option>
            <option value="project_manager">Project manager</option>
          </select>
          <ChevronDown size={12} />
        </label>
      </header>
      <main className="worker-content">
        {tab === "Home" ? (
          <>
            <div className="worker-greeting">
              <div>
                <span className="eyebrow">FRIDAY, OCTOBER 16</span>
                <h1>Good morning, Marcus</h1>
                <p>Your site plan and shift at a glance.</p>
              </div>
              <button
                className="worker-avatar"
                onClick={() => setTab("Profile")}
              >
                MB
              </button>
            </div>
            <div className="worker-project-card">
              <div className="worker-project-image" />
              <div className="worker-project-copy">
                <span className="worker-tag">
                  <span />
                  TODAY’S ASSIGNMENT
                </span>
                <h2>Skyline Tower</h2>
                <p>Phase 2 · Concrete structure</p>
                <div className="worker-location">
                  <MapPin size={15} />
                  742 Pine St, San Francisco
                </div>
                <div className="worker-project-meta">
                  <span>
                    <small>PROJECT MANAGER</small>
                    <strong>Daniel Kim</strong>
                  </span>
                  <span>
                    <small>PROJECT PROGRESS</small>
                    <strong>68%</strong>
                  </span>
                </div>
              </div>
            </div>
            <section className="worker-shift-card">
              <div className="worker-shift-heading">
                <div>
                  <h2>Your shift</h2>
                  <p>
                    {checkedIn
                      ? breakStarted
                        ? "On break · server state pending"
                        : "Active · attendance verified"
                      : "Not checked in"}
                  </p>
                </div>
                <StatusBadge>
                  {checkedIn
                    ? breakStarted
                      ? "Break active"
                      : "On shift"
                    : "Not checked in"}
                </StatusBadge>
              </div>
              <div className="worker-shift-info">
                <span>
                  <Clock3 size={16} />
                  7:00 AM – 3:30 PM
                </span>
                <span>
                  <MapPin size={16} />
                  100 m site radius
                </span>
              </div>
              <button
                className="button button-primary worker-main-action"
                onClick={handleMainAction}
              >
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
                  <strong>Level 8 slab preparation</strong>
                  <span>Daily progress · Due today</span>
                </div>
                <StatusBadge>2 / 3 tasks</StatusBadge>
              </div>
              <div className="task-progress-label">
                <span>Today’s progress</span>
                <strong>62%</strong>
              </div>
              <div className="worker-progress-track">
                <span />
              </div>
              <button
                className="worker-link-action"
                onClick={() =>
                  notify(
                    "Daily progress submission will be available after your work session is verified.",
                  )
                }
              >
                <Camera size={16} />
                Add progress update or photos
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="worker-stats">
              <div>
                <span className="stat-symbol green-symbol">
                  <Clock3 size={17} />
                </span>
                <strong>32.5h</strong>
                <small>This week</small>
              </div>
              <div>
                <span className="stat-symbol orange-symbol">
                  <Camera size={17} />
                </span>
                <strong>2</strong>
                <small>Photos pending</small>
              </div>
              <div>
                <span className="stat-symbol amber-symbol">
                  <Clock3 size={17} />
                </span>
                <strong>{breakStarted ? "—" : "60m"}</strong>
                <small>Break remaining</small>
              </div>
            </div>
            <div className="worker-section-title">
              <h2>Latest updates</h2>
              <button onClick={() => setTab("Alerts")}>
                All alerts
                <ArrowRight size={15} />
              </button>
            </div>
            <div className="worker-notice">
              <span className="notice-symbol">
                <Check size={17} />
              </span>
              <span>
                <strong>Progress update reviewed</strong>
                <small>Skyline Tower · Yesterday, 4:42 PM</small>
              </span>
              <time>Yesterday</time>
            </div>
          </>
        ) : tab === "Projects" ? (
          <>
            <PageHeading
              title="My projects"
              description="Your current assignment and available opportunities."
              action={null}
            />
            <div className="panel worker-assignment-card">
              <span className="worker-tag">
                <span />
                CURRENT ASSIGNMENT
              </span>
              <h2>Skyline Tower · Phase 2</h2>
              <p>Concrete structure · 742 Pine St, San Francisco</p>
              <div className="worker-location">
                <CalendarDays size={15} />
                Sep 02 – Dec 18, 2026
              </div>
              <div className="worker-project-meta">
                <span>
                  <small>SITE MANAGER</small>
                  <strong>Daniel Kim</strong>
                </span>
                <span>
                  <small>PROJECT STATUS</small>
                  <strong>In progress</strong>
                </span>
              </div>
            </div>
            <div className="worker-section-title">
              <h2>Available nearby</h2>
              <span>2 OPEN PROJECTS</span>
            </div>
            {[
              [
                "Harbor Point Residences",
                "North Wharf, Oakland · 2.4 mi",
                "Oct 20 – Nov 14",
                "Concrete finishing",
              ],
              [
                "Cedar Grove Community Center",
                "Fruitvale, Oakland · 4.1 mi",
                "Oct 22 – Nov 06",
                "Framing crew",
              ],
            ].map(([name, location, dates, trade]) => (
              <div className="worker-opportunity" key={name}>
                <span className="opportunity-icon">
                  <Building2 size={19} />
                </span>
                <h3>{name}</h3>
                <p>{trade}</p>
                <span>
                  <MapPin size={14} />
                  {location}
                </span>
                <span>
                  <CalendarDays size={14} />
                  {dates}
                </span>
                <button
                  className="button button-secondary"
                  onClick={() => {
                    notify(
                      "Project details opened. Acceptance is exclusive and requires server confirmation.",
                    );
                  }}
                >
                  View details
                  <ArrowRight size={15} />
                </button>
              </div>
            ))}
          </>
        ) : tab === "Attendance" ? (
          <>
            <PageHeading
              title="Attendance verification"
              description="Confirm your site location before recording a shift."
              action={null}
            />
            <div className="attendance-map">
              <div className="map-road road-one" />
              <div className="map-road road-two" />
              <div className="map-road road-three" />
              <div className="map-zone" />
              <div className="map-marker-site">
                <MapPin size={20} />
              </div>
              <div className="map-site-label">
                <strong>Skyline Tower</strong>
                <span>Project site</span>
              </div>
              <div className="map-legend">
                <span />
                Allowed attendance radius · 100 m
              </div>
            </div>
            <div className="verification-card">
              <div className="verification-title">
                <div className="verification-icon">
                  <MapPin size={20} />
                </div>
                <div>
                  <strong>Location not verified</strong>
                  <span>
                    Allow location access to check your distance from the site.
                  </span>
                </div>
              </div>
              <div className="verification-check">
                <ShieldCheck size={18} />
                <span>Attendance is permitted only within 100 metres.</span>
              </div>
              <div className="verification-check">
                <Camera size={18} />
                <span>A selfie and a live GPS fix are required.</span>
              </div>
              <button
                className="button button-primary"
                onClick={handleMainAction}
              >
                <MapPin size={17} />
                Start location verification
                <ArrowRight size={16} />
              </button>
              <div className="permission-help">
                If GPS accuracy is poor or camera permission is denied, enable
                the required permission in device settings and retry. Check-in
                remains unavailable until verified.
              </div>
            </div>
          </>
        ) : tab === "Alerts" ? (
          <>
            <PageHeading
              title="Notifications"
              description="Updates from your projects and crew."
              action={null}
            />
            <div className="worker-notification-list">
              {[
                [
                  "clipboard-check",
                  "Progress update reviewed",
                  "Skyline Tower · Yesterday, 4:42 PM",
                  true,
                ],
                [
                  "calendar",
                  "Shift starts tomorrow at 7:00 AM",
                  "Skyline Tower · Yesterday, 2:15 PM",
                  true,
                ],
                [
                  "file",
                  "New site plan added",
                  "Skyline Tower · Oct 14, 11:08 AM",
                  false,
                ],
              ].map(([icon, title, detail, unread]) => (
                <button
                  className="worker-notification"
                  key={title}
                  onClick={() => notify(`${title} opened.`)}
                >
                  <span
                    className={`notification-symbol ${unread ? "is-unread" : ""}`}
                  >
                    {icon === "calendar" ? (
                      <CalendarDays size={18} />
                    ) : icon === "file" ? (
                      <FileText size={18} />
                    ) : (
                      <Check size={18} />
                    )}
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <small>{detail}</small>
                  </span>
                  {unread && <i />}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <PageHeading
              title="Profile & settings"
              description="Your account, work preferences, and permissions."
              action={null}
            />
            <div className="worker-profile-card">
              <div className="worker-avatar large-avatar">MB</div>
              <h2>Marcus Brody</h2>
              <p>Concrete crew · Field operations</p>
              <div className="profile-detail">
                <span>Email</span>
                <strong>marcus.brody@example.com</strong>
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
            <button
              className="button button-secondary profile-signout"
              onClick={isPreview ? () => onRoleChange("admin") : onLogout}
            >
              {isPreview ? "Return to admin preview" : "Sign out"}
            </button>
          </>
        )}
      </main>
      <nav className="worker-bottom-nav">
        {workerTabs.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={tab === label ? "worker-tab-active" : ""}
            onClick={() => setTab(label)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {toast && (
        <div className="toast">
          <CircleCheck size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}

function WorkerDesktopNotice({ onSignOut }) {
  return (
    <main className="worker-desktop-notice">
      <div className="worker-desktop-card">
        <span className="eyebrow">BUILDFlow FIELD WORKSPACE</span>
        <h1>Open the worker workspace on a mobile-sized screen</h1>
        <p>Worker tools are available in the dedicated mobile interface. Resize this window or open the app on a mobile device to continue.</p>
        <button className="button button-secondary" type="button" onClick={onSignOut}>Sign out</button>
      </div>
    </main>
  );
}

function App() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const [activeRole, setActiveRole] = useState(() => sessionStorage.getItem("buildflow-role"));

  const updateActiveRole = useCallback(nextRole => {
    if (nextRole) sessionStorage.setItem("buildflow-role", nextRole);
    else sessionStorage.removeItem("buildflow-role");
    setActiveRole(nextRole || null);
  }, []);

  const acceptMobileAuthentication = useCallback((user, token) => {
    sessionStorage.setItem("buildflow-session", token);
    updateActiveRole(user.role);
  }, [updateActiveRole]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const onChange = event => setIsMobile(event.matches);
    media.addEventListener?.("change", onChange);
    if (!media.addEventListener) media.addListener(onChange);
    return () => {
      media.removeEventListener?.("change", onChange);
      if (!media.removeEventListener) media.removeListener(onChange);
    };
  }, []);

  if (activeRole === "worker" && !isMobile) {
    return (
      <WorkerDesktopNotice
        onSignOut={() => {
          sessionStorage.removeItem("buildflow-session");
          updateActiveRole(null);
        }}
      />
    );
  }

  if (activeRole !== "admin" && activeRole !== "project_manager" && isMobile) {
    return (
      <MobileWorkerApp
        onAuthenticated={acceptMobileAuthentication}
        onRoleChange={updateActiveRole}
      />
    );
  }

  return <WebWorkspaceApp onRoleChange={updateActiveRole} />;
}

export default App;
