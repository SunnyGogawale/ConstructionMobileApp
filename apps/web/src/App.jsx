import { useMemo, useState } from "react";
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
  FileText,
  Filter,
  HardHat,
  LayoutDashboard,
  MapPin,
  Menu,
  MoreHorizontal,
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
  { id: "users", label: "People", icon: Users, group: "Manage", admin: true },
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

const revenueData = [
  { month: "May", revenue: 312 },
  { month: "Jun", revenue: 356 },
  { month: "Jul", revenue: 330 },
  { month: "Aug", revenue: 418 },
  { month: "Sep", revenue: 392 },
  { month: "Oct", revenue: 486 },
];

const attendanceData = [
  { day: "Mon", workers: 78 },
  { day: "Tue", workers: 86 },
  { day: "Wed", workers: 82 },
  { day: "Thu", workers: 91 },
  { day: "Fri", workers: 87 },
  { day: "Sat", workers: 38 },
];

const projectStatusData = [
  { name: "In progress", value: 12, color: "#e87524" },
  { name: "Awaiting crew", value: 5, color: "#d6a04e" },
  { name: "Completed", value: 8, color: "#338264" },
  { name: "Cancelled", value: 2, color: "#9aa7aa" },
];

const initialProjects = [
  {
    id: "BLD-2408",
    name: "Skyline Tower · Phase 2",
    client: "Northstar Properties",
    manager: "Daniel Kim",
    crew: "12 workers",
    dates: "Sep 02 – Dec 18",
    budget: "$1,240,000",
    progress: 68,
    status: "In progress",
    image: "photo-1486406146926-c627a92ad1ab",
  },
  {
    id: "BLD-2412",
    name: "Riverside Medical Pavilion",
    client: "Horizon Health Group",
    manager: "Sarah Chen",
    crew: "8 workers",
    dates: "Aug 14 – Jan 30",
    budget: "$860,000",
    progress: 42,
    status: "In progress",
    image: "photo-1497366754035-f200968a6e72",
  },
  {
    id: "BLD-2418",
    name: "Cedar Grove Community Center",
    client: "City of Oakland",
    manager: "Marcus Lee",
    crew: "Crew needed",
    dates: "Oct 22 – Mar 16",
    budget: "$525,000",
    progress: 0,
    status: "Awaiting crew",
    image: "photo-1511818966892-d7d671e672a2",
  },
  {
    id: "BLD-2396",
    name: "Pier 7 Retail Renovation",
    client: "Harbor Retail LLC",
    manager: "Sarah Chen",
    crew: "6 workers",
    dates: "May 06 – Sep 28",
    budget: "$318,500",
    progress: 100,
    status: "Completed",
    image: "photo-1511818966892-d7d671e672a2",
  },
];

const moduleRows = {
  users: [
    ["Maya Thompson", "Project manager", "4 projects", "Active"],
    ["Daniel Kim", "Project manager", "3 projects", "Active"],
    ["Marcus Brody", "Worker · Concrete", "Skyline Tower", "Active"],
    ["Alicia Reyes", "Worker · Electrician", "Riverside Pavilion", "Invited"],
  ],
  clients: [
    [
      "Northstar Properties",
      "Olivia Grant",
      "Skyline Tower · Phase 2",
      "$1.24M",
    ],
    [
      "Horizon Health Group",
      "Ben Carter",
      "Riverside Medical Pavilion",
      "$860K",
    ],
    ["City of Oakland", "Public Works", "Cedar Grove Center", "$525K"],
  ],
  assignment: [
    [
      "Cedar Grove Community Center",
      "Oakland · 4.1 mi",
      "Oct 22 – Mar 16",
      "Framing crew",
      "Awaiting crew",
    ],
    [
      "Harbor Point Residences",
      "North Wharf · 2.4 mi",
      "Oct 20 – Nov 14",
      "Concrete finishers",
      "Available",
    ],
    [
      "Market Street Retrofit",
      "Downtown · 1.8 mi",
      "Oct 24 – Dec 02",
      "Steel crew · 4 needed",
      "Available",
    ],
  ],
  attendance: [
    ["Marcus Brody", "Skyline Tower", "7:02 AM", "7:14 AM", "Verified · 42 m"],
    ["Jen Park", "Skyline Tower", "7:08 AM", "7:19 AM", "Verified · 61 m"],
    [
      "Omar Wilson",
      "Riverside Pavilion",
      "7:12 AM",
      "7:26 AM",
      "Review · 118 m",
    ],
  ],
  progress: [
    [
      "Skyline Tower · Level 8 slab",
      "Marcus Brody",
      "Today · 10:42 AM",
      "62%",
      "Review needed",
    ],
    [
      "Riverside Pavilion · East wing",
      "Jen Park",
      "Today · 9:18 AM",
      "48%",
      "Approved",
    ],
    [
      "Pier 7 · Final inspection",
      "Omar Wilson",
      "Yesterday · 3:52 PM",
      "100%",
      "Approved",
    ],
  ],
  quotations: [
    [
      "QUO-2026-084",
      "Northstar Properties",
      "Skyline Tower · Phase 2",
      "$84,500",
      "Sent",
    ],
    [
      "QUO-2026-083",
      "City of Oakland",
      "Cedar Grove Center",
      "$126,300",
      "Draft",
    ],
    [
      "QUO-2026-081",
      "Horizon Health Group",
      "Riverside Pavilion",
      "$52,800",
      "Accepted",
    ],
  ],
  invoices: [
    [
      "INV-2026-216",
      "Northstar Properties",
      "Oct 01, 2026",
      "Oct 31, 2026",
      "$48,250",
      "Partially paid",
    ],
    [
      "INV-2026-215",
      "Horizon Health Group",
      "Sep 28, 2026",
      "Oct 28, 2026",
      "$32,100",
      "Pending",
    ],
    [
      "INV-2026-210",
      "Harbor Retail LLC",
      "Sep 12, 2026",
      "Oct 12, 2026",
      "$18,600",
      "Overdue",
    ],
  ],
  payments: [
    [
      "PAY-90842",
      "Northstar Properties",
      "Oct 14, 2026",
      "ACH transfer",
      "$24,000",
      "Received",
    ],
    [
      "PAY-90839",
      "Harbor Retail LLC",
      "Oct 12, 2026",
      "Wire transfer",
      "$18,600",
      "Received",
    ],
    [
      "PAY-90818",
      "Horizon Health Group",
      "Oct 08, 2026",
      "Check · 2048",
      "$12,500",
      "Pending",
    ],
  ],
  expenses: [
    [
      "Concrete materials",
      "Skyline Tower · Phase 2",
      "Oct 15, 2026",
      "Materials",
      "$8,420",
      "Pending approval",
    ],
    [
      "Lift rental · Week 41",
      "Riverside Pavilion",
      "Oct 14, 2026",
      "Equipment",
      "$2,180",
      "Approved",
    ],
    [
      "Site safety supplies",
      "Cedar Grove Center",
      "Oct 13, 2026",
      "Safety",
      "$640",
      "Approved",
    ],
  ],
  notifications: [
    [
      "Completion review submitted",
      "Skyline Tower · Marcus Brody",
      "12 minutes ago",
      "Progress",
    ],
    [
      "Invoice payment received",
      "INV-2026-210 · Harbor Retail LLC",
      "1 hour ago",
      "Finance",
    ],
    [
      "Crew requested",
      "Cedar Grove Community Center",
      "3 hours ago",
      "Assignment",
    ],
  ],
};

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
  users: ["Name", "Role", "Assignment", "Status"],
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
      <span className="status-dot" />
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

function App() {
  const [role, setRole] = useState("admin");
  const [page, setPage] = useState("overview");
  const [sessionToken, setSessionToken] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [projects, setProjects] = useState(initialProjects);
  const [selectedProject, setSelectedProject] = useState(null);
  const [records, setRecords] = useState(moduleRows);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [dialog, setDialog] = useState(false);
  const [recordDialog, setRecordDialog] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [workerTab, setWorkerTab] = useState("Home");

  const availableNavigation = useMemo(
    () =>
      navigation.filter(
        (item) =>
          role === "admin" ||
          !item.admin,
      ),
    [role],
  );

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const text =
          `${project.id} ${project.name} ${project.client} ${project.manager}`.toLowerCase();
        const matchesQuery = text.includes(query.toLowerCase());
        const matchesStatus =
          statusFilter === "All statuses" || project.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [projects, query, statusFilter],
  );

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };

  const handleWebLogin = async (email, password) => {
    setLoginError("");
    const apiUrl = import.meta.env.VITE_API_URL;
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
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Sign-in failed.");
      setSessionToken(result.token);
      setRole(result.user.role);
      setPage("overview");
    } catch (error) {
      setLoginError(error.message);
    }
  };

  async function handleCreateProject(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get("projectName")?.toString().trim();
    if (!name) return;
    const isDraft = Boolean(form.get("saveDraft"));
    const apiUrl = import.meta.env.VITE_API_URL;
    let project = {
      id: `BLD-${String(2420 + projects.length).padStart(4, "0")}`,
      name,
      client: form.get("clientName")?.toString() || "New client",
      manager: "Sarah Chen",
      crew: "Crew needed",
      dates: `${form.get("startDate")} – ${form.get("endDate")}`,
      budget: form.get("budget")?.toString() || "Not set",
      progress: 0,
      status: isDraft ? "Draft" : "Awaiting crew",
      image: "photo-1486406146926-c627a92ad1ab",
    };
    if (sessionToken && apiUrl) {
      try {
        const response = await fetch(`${apiUrl}/api/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
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
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Project could not be created.");
        project = {
          ...project,
          id: result.project.projectId,
          status: result.project.status === "Open" ? "Awaiting crew" : result.project.status,
          manager: "You",
        };
      } catch (error) {
        notify(error.message);
        return;
      }
    }
    setProjects((current) => [project, ...current]);
    setDialog(false);
    setPage("projects");
    notify(
      `${name} ${project.status === "Draft" ? "saved as a draft" : "created and opened for assignment"}`,
    );
  }

  async function handleCreateRecord(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name) => form.get(name)?.toString().trim() || "";
    const money = (amount) => `$${(Number(amount) || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    const reference = (prefix, existing) => `${prefix}-${new Date().getFullYear()}-${String(existing.length + 1).padStart(3, "0")}`;
    let row;
    if (recordDialog === "users") row = [value("name"), value("role"), value("assignment") || "Unassigned", "Invited"];
    if (recordDialog === "clients") row = [value("name"), value("contactName"), value("project") || "No active project", value("contractValue") ? money(value("contractValue")) : "$0"];
    if (recordDialog === "quotations") {
      const subtotal = (Number(value("labour")) || 0) + (Number(value("materials")) || 0) + (Number(value("quantity")) || 0) * (Number(value("unitPrice")) || 0);
      const total = Math.max(0, subtotal * (1 + (Number(value("tax")) || 0) / 100) - (Number(value("discount")) || 0));
      row = [reference("QUO", records.quotations), value("client"), value("project"), money(total), "Draft"];
    }
    if (recordDialog === "invoices") {
      const subtotal = (Number(value("labour")) || 0) + (Number(value("materials")) || 0) + (Number(value("quantity")) || 0) * (Number(value("unitPrice")) || 0);
      const total = Math.max(0, subtotal * (1 + (Number(value("tax")) || 0) / 100) - (Number(value("discount")) || 0));
      row = [reference("INV", records.invoices), value("client"), value("invoiceDate"), value("dueDate"), money(total), "Pending"];
    }
    if (recordDialog === "payments") row = [reference("PAY", records.payments), value("client"), value("date"), value("method"), money(value("amount")), value("status")];
    if (recordDialog === "expenses") row = [value("description"), value("project"), value("date"), value("category"), money(value("amount")), "Pending approval"];
    if (!row) return;
    if (sessionToken && recordDialog === "users") {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
          body: JSON.stringify({ name: value("name"), email: value("email"), password: value("password"), role: value("role") }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "User could not be created.");
        row[0] = result.user.name;
        row[1] = result.user.role === "project_manager" ? "Project manager" : result.user.role;
        row[3] = result.user.active ? "Active" : "Inactive";
      } catch (error) {
        notify(error.message);
        return;
      }
    }
    if (sessionToken && ["quotation", "invoice", "payment", "expense"].includes(recordDialog)) {
      const number = (name) => Number(value(name)) || 0;
      const payload = recordDialog === "quotation" || recordDialog === "invoice"
        ? {
            client: value("client"), projectId: value("project"), description: value("item"),
            labourCharges: number("labour"), materialCharges: number("materials"), quantity: number("quantity"),
            unitPrice: number("unitPrice"), taxRate: number("tax"), discount: number("discount"),
            ...(recordDialog === "quotation" ? { validUntil: value("validUntil") } : { issueDate: value("invoiceDate"), dueDate: value("dueDate") }),
          }
        : recordDialog === "payments"
          ? { client: value("client"), projectId: value("project"), description: `Payment for invoice ${value("invoice")}`, amountReceived: number("amount"), paymentMethod: value("method"), transactionReference: value("reference"), paidAt: value("date"), status: value("status") }
          : { client: value("client"), projectId: value("project"), description: value("description"), category: value("category"), total: number("amount"), issueDate: value("date"), receiptUrl: value("receipt") };
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(`${apiUrl}/api/finance/${recordDialog}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Finance record could not be saved.");
        const record = result.record;
        row[0] = record.reference;
        if (recordDialog === "quotation") row[3] = money(record.total);
        if (recordDialog === "invoice") row[4] = money(record.total);
        if (recordDialog === "payments") row[0] = record.reference;
        if (recordDialog === "expenses") row[0] = record.description;
      } catch (error) {
        notify(error.message);
        return;
      }
    }
    setRecords((current) => ({ ...current, [recordDialog]: [row, ...current[recordDialog]] }));
    notify(`${pageTitles[recordDialog]} record added to this workspace.`);
    setRecordDialog("");
  }

  const goTo = (id) => {
    setPage(id);
    setMobileMenu(false);
    setQuery("");
  };

  const visibleNavigation =
    role === "admin"
      ? availableNavigation
      : navigation.filter(
          (item) =>
            item.id !== "users" &&
            item.id !== "settings",
        );

  if (role === "worker") {
    return (
      <WorkerWorkspace
        tab={workerTab}
        setTab={setWorkerTab}
        onRoleChange={setRole}
        isPreview={!sessionToken}
        onLogout={() => {
          setSessionToken(null);
          setRole("admin");
          setPage("login");
        }}
        notify={notify}
        toast={toast}
      />
    );
  }

  if (page === "login") {
    return <WebLogin error={loginError} onLogin={handleWebLogin} onBack={() => setPage("overview")} />;
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
          <div className="workspace-symbol">N</div>
          <div>
            <strong>Northstar Build Co.</strong>
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
                    {count && <span className="nav-count">{count}</span>}
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
            onClick={() => {
              setSessionToken(null);
              setPage("login");
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=96&q=80"
              alt=""
            />
            <span className="profile-copy">
              <strong>Jordan Davis</strong>
              <span>
                {role === "admin" ? "Administrator" : "Project manager"}
              </span>
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
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects, people..."
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="topbar-actions">
            <label className="role-select-label">
              <span>Role</span>
              <select
                value={role}
                disabled={Boolean(sessionToken)}
                onChange={(event) => {
                  setRole(event.target.value);
                  setPage("overview");
                }}
              >
                <option value="admin">Admin</option>
                <option value="project_manager">Project manager</option>
                <option value="worker">Worker</option>
              </select>
              <ChevronDown size={12} />
            </label>
            <button
              className="icon-button top-notification"
              aria-label="Notifications"
              onClick={() => goTo("notifications")}
            >
              <Bell size={19} />
              <span className="notification-count">3</span>
            </button>
            <img
              className="top-avatar"
              src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=96&q=80"
              alt="Jordan Davis"
            />
          </div>
        </header>

        <div className="page-content">
          {page === "overview" ? (
            <Dashboard
              role={role}
              onCreate={() => setDialog(true)}
              onNavigate={goTo}
              projects={projects}
              onProjectSelect={setSelectedProject}
            />
          ) : page === "projects" ? (
            <ProjectsPage
              projects={filteredProjects}
              query={query}
              setStatusFilter={setStatusFilter}
              statusFilter={statusFilter}
              onCreate={() => setDialog(true)}
              notify={notify}
              onProjectSelect={setSelectedProject}
            />
          ) : page === "reports" ? (
            <ReportsPage />
          ) : page === "settings" ? (
            <SettingsPage notify={notify} />
          ) : (
            <ModulePage
              page={page}
              query={query}
              notify={notify}
              rows={records[page] || []}
              onCreate={() => setRecordDialog(page)}
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
      {recordDialog && <RecordDialog page={recordDialog} onClose={() => setRecordDialog("")} onSubmit={handleCreateRecord} />}
      {selectedProject && <ProjectWorkspaceModal project={selectedProject} onClose={() => setSelectedProject(null)} onNavigate={goTo} />}
      {toast && (
        <div className="toast">
          <CircleCheck size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}

function WebLogin({ error, onLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgot, setForgot] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (forgot) {
      onBack();
      return;
    }
    setBusy(true);
    await onLogin(email.trim(), password);
    setBusy(false);
  };
  return (
    <main className="login-screen">
      <div className="login-photo" role="img" aria-label="Modern construction site" />
      <section className="login-panel">
        <div className="login-brand"><span className="brand-mark"><Building2 size={21}/></span><span><strong>BuildFlow</strong><small>CONSTRUCTION OPERATIONS</small></span></div>
        <div className="login-form-wrap">
          <span className="eyebrow">SECURE WORKSPACE</span>
          <h1>{forgot ? "Reset your password" : "Welcome back"}</h1>
          <p>{forgot ? "Enter your work email to request a password reset." : "Sign in to manage projects, crews, and site operations."}</p>
          <form onSubmit={submit}>
            <label>Work email<input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" /></label>
            {!forgot && <label>Password<input required autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></label>}
            {error && <div className="login-error">{error}</div>}
            {forgot && <div className="login-notice">Password reset delivery must be configured by your administrator.</div>}
            <button className="button button-primary login-submit" type="submit">{busy ? "Signing in…" : forgot ? "Continue" : "Sign in"}<ArrowRight size={16}/></button>
          </form>
          <button className="login-link" onClick={() => setForgot((current) => !current)}>{forgot ? "Back to sign in" : "Forgot password?"}</button>
        </div>
        <div className="login-footer"><ShieldCheck size={15}/>Authorized access for BuildFlow team members</div>
      </section>
    </main>
  );
}

  function Dashboard({ role, onCreate, onNavigate, projects, onProjectSelect }) {
  const isAdmin = role === "admin";
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            FRIDAY, OCTOBER 16, 2026 <span className="heading-dot" /> WEEK 42
          </div>
          <h1>{isAdmin ? "Good morning, Jordan" : "Your project portfolio"}</h1>
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
        <MetricCard label="Total users" value="118" change={<><span className="change-positive">+8</span> this month</>} icon={Users} onClick={() => onNavigate("users")} />
        <MetricCard label="Active workers" value="94" change={<><span className="change-positive">86</span> on site today</>} icon={HardHat} tone="green" onClick={() => onNavigate("attendance")} />
        <MetricCard label="Total projects" value="27" change={<><span className="change-positive">+3</span> from last month</>} icon={Building2} tone="blue" onClick={() => onNavigate("projects")} />
        <MetricCard label="Active projects" value="12" change={<><span className="change-positive">84%</span> on schedule</>} icon={ChartNoAxesCombined} onClick={() => onNavigate("projects")} />
        <MetricCard label="Completed projects" value="8" change="This calendar year" icon={CircleCheck} tone="green" onClick={() => onNavigate("projects")} />
        <MetricCard label="Today's attendance" value="91%" change={<><span className="change-positive">86 of 94</span> workers checked in</>} icon={Clock3} tone="amber" onClick={() => onNavigate("attendance")} />
        <MetricCard label="Total revenue" value="$2.4M" change={<><span className="change-positive">+$142K</span> this month</>} icon={Wallet} tone="blue" onClick={() => onNavigate("reports")} />
        <MetricCard label="Pending payments" value="$184.2k" change={<><span className="change-negative">$18.6k</span> past due</>} icon={CircleDollarSign} tone="amber" onClick={() => onNavigate("invoices")} />
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
            <strong>$486,320</strong>
            <span className="change-positive">↑ 12.8%</span>
            <span>vs. previous period</span>
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
              <strong>27</strong>
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
            <strong>86</strong>
            <span>of 94 scheduled workers checked in</span>
          </div>
          <div className="attendance-track">
            <span style={{ width: "91%" }} />
          </div>
          <div className="attendance-meta">
            <span>
              <i className="green-dot" />
              On site <strong>86</strong>
            </span>
            <span>
              <i className="amber-dot" />
              Not checked in <strong>5</strong>
            </span>
            <span>
              <i className="gray-dot" />
              On leave <strong>3</strong>
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
            <span className="counter-pill">4 items</span>
          </div>
          <ApprovalRow
            title="Daily progress · Level 8 slab"
            detail="Skyline Tower · Marcus Brody · 12 min ago"
            tone="orange"
          />
          <ApprovalRow
            title="Material expense · $8,420"
            detail="Skyline Tower · Submitted by Daniel Kim"
            tone="amber"
          />
          <ApprovalRow
            title="Completion review"
            detail="Pier 7 Retail · Final inspection submitted"
            tone="green"
          />
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
          <ActivityRow
            initials="MR"
            color="coral"
            title="Marcus submitted a progress update"
            detail="Skyline Tower · Level 8 slab"
            time="12m"
          />
          <ActivityRow
            initials="DK"
            color="blue"
            title="Invoice payment received"
            detail="Harbor Retail · INV-2026-210"
            time="1h"
          />
          <ActivityRow
            initials="SC"
            color="green"
            title="New project created"
            detail="Cedar Grove Community Center"
            time="3h"
          />
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
                    src={`https://images.unsplash.com/${project.image}?auto=format&fit=crop&w=100&q=75`}
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

function ProjectWorkspaceModal({ project, onClose, onNavigate }) {
  const [activeTab, setActiveTab] = useState("Overview");
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog project-workspace-dialog" role="dialog" aria-modal="true" aria-labelledby="project-workspace-title">
        <div className="project-workspace-heading">
          <div className="project-workspace-photo" style={{ backgroundImage: `url(https://images.unsplash.com/${project.image}?auto=format&fit=crop&w=500&q=80)` }} />
          <div className="project-workspace-title"><span className="eyebrow">{project.id} · {project.client}</span><h2 id="project-workspace-title">{project.name}</h2><span className="project-workspace-meta">{project.manager} · {project.dates}</span></div>
          <StatusBadge>{project.status}</StatusBadge>
          <button className="icon-button" onClick={onClose} aria-label="Close project workspace"><X size={19}/></button>
        </div>
        <div className="project-tab-strip" role="tablist" aria-label="Project sections">
          {projectTabs.map((tab) => <button key={tab} role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "project-tab-active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}
        </div>
        <div className="project-workspace-content">
          {activeTab === "Overview" ? <div className="project-overview-grid"><div className="project-overview-main"><div className="project-progress-head"><div><span>Overall completion</span><strong>{project.progress}%</strong></div><StatusBadge>{project.status}</StatusBadge></div><div className="project-overview-track"><span style={{ width: `${project.progress}%` }}/></div><div className="project-details-kpis"><div><span>Contract budget</span><strong>{project.budget}</strong></div><div><span>Assigned crew</span><strong>{project.crew}</strong></div><div><span>Project manager</span><strong>{project.manager}</strong></div></div><div className="project-timeline"><h3>Project timeline</h3><div><i className="timeline-complete"/><span><strong>Project created</strong><small>Site approved and opened for assignment</small></span><time>{project.dates.split("–")[0]}</time></div><div><i className={project.progress > 0 ? "timeline-complete" : ""}/><span><strong>Work in progress</strong><small>Field updates and milestones</small></span><time>{project.progress ? `${project.progress}%` : "Upcoming"}</time></div><div><i/><span><strong>Completion review</strong><small>Final photos and manager approval</small></span><time>Upcoming</time></div></div></div><aside className="project-location-panel"><div className="project-mini-map"><MapPin size={23}/></div><span className="eyebrow">SITE LOCATION</span><strong>{project.address || "Location coordinates pending"}</strong><p>Attendance boundary · 100 m</p><button className="button button-secondary" onClick={() => onNavigate("attendance")}><Clock3 size={15}/>View attendance</button></aside></div>
            : activeTab === "Assigned worker" ? <ModuleRecordView title="Assigned crew" details={[project.crew, project.manager, "Site assignment and role details are permission-scoped."]} />
              : activeTab === "Attendance" ? <ModuleRecordView title="Recent attendance" details={["Marcus Brody · Checked in 7:02 AM · GPS verified · 42 m", "Jen Park · Checked in 7:08 AM · GPS verified · 61 m", "Check-in is blocked outside the configured site radius."]} />
                : activeTab === "Daily progress" ? <ModuleRecordView title="Progress timeline" details={["Level 8 slab preparation · 62% · Submitted 10:42 AM", "East wing forms and reinforcement · Approved yesterday", "Manager feedback and revisions appear on each update."]} />
                  : activeTab === "Photos & documents" ? <ModuleRecordView title="Site files" details={["Site plan · Rev 4 · PDF", "Level 8 slab · 6 work photos", "Safety inspection · Oct 14, 2026"]} />
                    : activeTab === "Quotations & invoices" ? <ModuleRecordView title="Project finances" details={["QUO-2026-084 · $84,500 · Sent", "INV-2026-216 · $48,250 · Partially paid", "Outstanding balance · $24,250"]} />
                      : <ModuleRecordView title="Activity history" details={["Progress update submitted by Marcus Brody · 12 minutes ago", "Invoice payment received · 1 hour ago", "Crew assignment updated by project manager · Yesterday"]} />}
        </div>
      </section>
    </div>
  );
}

function ModuleRecordView({ title, details }) {
  return <section className="project-record-view"><div className="panel-heading"><div><h2>{title}</h2><p>Latest records for this project</p></div><button className="button button-secondary"><Filter size={15}/>Filter</button></div>{details.map((detail, index) => <div className="project-record-row" key={detail}><span className={`project-record-icon ${index === 0 ? "record-icon-orange" : ""}`}><FileText size={17}/></span><span>{detail}</span><ArrowUpRight size={15}/></div>)}</section>;
}

function ProjectsPage({
  projects,
  query,
  setStatusFilter,
  statusFilter,
  onCreate,
  notify,
  onProjectSelect,
}) {
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
          <span>Portfolio value</span>
          <strong>$8.42M</strong>
          <small>Across 27 active and upcoming projects</small>
        </div>
        <div>
          <span>On schedule</span>
          <strong>84%</strong>
          <small className="green-copy">↑ 6% from last month</small>
        </div>
        <div>
          <span>Awaiting crew</span>
          <strong>5</strong>
          <small>2 projects start this week</small>
        </div>
        <div>
          <span>At risk</span>
          <strong className="orange-copy">3</strong>
          <small>Needs manager review</small>
        </div>
      </div>
      <div className="panel table-panel">
        <div className="list-toolbar">
          <div className="filter-tabs">
            <button
              className={statusFilter === "All statuses" ? "filter-active" : ""}
              onClick={() => setStatusFilter("All statuses")}
            >
              All projects <span>27</span>
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
        <div className="table-pagination">
          <span>
            Showing <strong>{projects.length}</strong> of 27 projects
            {query ? ` matching “${query}”` : ""}
          </span>
          <div>
            <button disabled>Previous</button>
            <button className="page-current">1</button>
            <button>2</button>
            <button>3</button>
            <button>Next</button>
          </div>
        </div>
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

function ModulePage({ page, query, notify, onCreate, rows = [] }) {
  const filteredRows = rows.filter((row) =>
    row.join(" ").toLowerCase().includes(query.toLowerCase()),
  );
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
        onClick={() =>
          ["assignment", "attendance", "notifications", "progress"].includes(page)
            ? notify(`${pageTitles[page]} opened for review.`)
            : onCreate()
        }
      >
        <Plus size={17} />
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
          <span>{page === "invoices" ? "Outstanding" : "Total records"}</span>
          <strong>
            {page === "invoices"
              ? "$184,250"
              : page === "attendance"
                ? "86 / 94"
                : page === "progress"
                  ? "12"
                  : rows.length + 16}
          </strong>
        </div>
        <div>
          <span>Needs attention</span>
          <strong className="orange-copy">
            {page === "notifications" ? "3 new" : "4"}
          </strong>
        </div>
        <div>
          <span>Updated</span>
          <strong>Just now</strong>
        </div>
        <div>
          <span>Workspace coverage</span>
          <strong>All active sites</strong>
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
            <span>{filteredRows.length} records in this view</span>
          </div>
          <div className="toolbar-actions">
            <button
              className="button button-secondary"
              onClick={() => notify("Filters applied to this view.")}
            >
              <Filter size={15} />
              Filters
            </button>
            <button
              className="icon-button small-icon"
              onClick={() => notify("View options opened.")}
              aria-label="View options"
            >
              <MoreHorizontal size={19} />
            </button>
          </div>
        </div>
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
                      {cellIndex === row.length - 1 &&
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
                      ) : (
                        <span className={cellIndex === 0 ? "strong-cell" : ""}>
                          {cell}
                        </span>
                      )}
                    </td>
                  ))}
                  <td>
                    <button
                      className="icon-button row-action"
                      aria-label={`Open ${row[0]}`}
                      onClick={() => notify(`${row[0]} details opened.`)}
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-pagination">
          <span>
            Showing <strong>{filteredRows.length}</strong> of {rows.length}{" "}
            records
          </span>
          <div>
            <button disabled>Previous</button>
            <button className="page-current">1</button>
            <button>Next</button>
          </div>
        </div>
      </div>
    </>
  );
}

const recordDialogFields = {
  users: [
    { name: "name", label: "Full name", required: true },
    { name: "email", label: "Work email", type: "email", required: true },
    { name: "role", label: "System role", type: "select", options: [["worker", "Worker"], ["project_manager", "Project manager"], ["admin", "Admin"]] },
    { name: "password", label: "Temporary password (12+ characters)", type: "password", required: true },
    { name: "assignment", label: "Initial project assignment", placeholder: "Optional" },
  ],
  clients: [
    { name: "name", label: "Client or organization", required: true },
    { name: "contactName", label: "Primary contact", required: true },
    { name: "email", label: "Contact email", type: "email" },
    { name: "phone", label: "Contact phone", type: "tel" },
    { name: "project", label: "Active project", placeholder: "Optional" },
    { name: "contractValue", label: "Contract value", type: "number", min: 0, placeholder: "0.00" },
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

function RecordDialog({ page, onClose, onSubmit }) {
  const fields = recordDialogFields[page] || [];
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog record-dialog" role="dialog" aria-modal="true" aria-labelledby="record-dialog-title">
        <div className="dialog-heading">
          <div><span className="eyebrow">{pageTitles[page]?.toUpperCase()}</span><h2 id="record-dialog-title">{recordDialogTitles[page]}</h2><p>Complete the details to add this record to the workspace.</p></div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19}/></button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="record-fields">
            {fields.map((field) => (
              <label className={field.wide ? "record-field-wide" : ""} key={field.name}>
                {field.label}
                {field.type === "select" ? <select name={field.name} required={field.required} defaultValue={field.options?.[0]?.[0]}>{field.options?.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : <input name={field.name} type={field.type || "text"} min={field.min} step={field.step} placeholder={field.placeholder} defaultValue={field.defaultValue} required={field.required}/>}
              </label>
            ))}
          </div>
          {(page === "quotations" || page === "invoices") && <div className="record-note"><CircleDollarSign size={16}/><span>Subtotal combines labour, materials, and quantity × unit price. Tax and discount are then applied.</span></div>}
          <div className="dialog-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary"><Check size={16}/>{page === "users" ? "Send invite" : "Save record"}</button></div>
        </form>
      </section>
    </div>
  );
}

function ReportsPage() {
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
          <strong>72.4%</strong>
          <small className="change-positive">↑ 4.2% vs. last month</small>
          <div className="report-bar">
            <span style={{ width: "72%" }} />
          </div>
        </div>
        <div className="panel report-card">
          <span>Labor utilization</span>
          <strong>88.6%</strong>
          <small>1,248 hours logged this week</small>
          <div className="report-bar green-bar">
            <span style={{ width: "88%" }} />
          </div>
        </div>
        <div className="panel report-card">
          <span>Revenue collected</span>
          <strong>$1.82M</strong>
          <small className="change-positive">↑ 12.8% vs. previous period</small>
          <div className="report-bar blue-bar">
            <span style={{ width: "64%" }} />
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
            <AreaChart data={revenueData}>
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
                tickFormatter={(value) => `$${value}k`}
              />
              <Tooltip formatter={(value) => [`$${value}k`, "Revenue"]} />
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
      </div>
    </>
  );
}

function SettingsPage({ notify }) {
  return (
    <>
      <PageHeading
        title="Settings & access"
        description="Manage workspace identity, role boundaries, and notification preferences."
        action={
          <button
            className="button button-primary"
            onClick={() => notify("Workspace settings saved.")}
          >
            <Check size={16} />
            Save changes
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
        <div className="panel settings-form">
          <h2>Workspace profile</h2>
          <p>
            Company details used across project records and client documents.
          </p>
          <label>
            Company name
            <input defaultValue="Northstar Build Co." />
          </label>
          <div className="settings-form-row">
            <label>
              Primary contact
              <input defaultValue="Jordan Davis" />
            </label>
            <label>
              Business email
              <input defaultValue="operations@northstarbuild.co" />
            </label>
          </div>
          <label>
            Default attendance radius
            <div className="input-suffix">
              <input type="number" defaultValue="100" />
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
        </div>
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

export default App;
