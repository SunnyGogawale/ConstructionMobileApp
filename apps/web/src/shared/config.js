import { Activity, Bell, BriefcaseBusiness, Building2, ChartNoAxesCombined, Clock3, CreditCard, FileText, HardHat, LayoutDashboard, Settings, Users, Wallet } from "lucide-react";
export const navigation = [{
  id: "overview",
  label: "Overview",
  icon: LayoutDashboard,
  group: "Workspace"
}, {
  id: "projects",
  label: "Projects",
  icon: Building2,
  group: "Workspace"
}, {
  id: "assignment",
  label: "Worker assignment",
  icon: HardHat,
  group: "Workspace",
  pm: true
}, {
  id: "attendance",
  label: "Attendance",
  icon: Clock3,
  group: "Workspace"
}, {
  id: "progress",
  label: "Work progress",
  icon: Activity,
  group: "Workspace"
}, {
  id: "users",
  label: "People",
  icon: Users,
  group: "Manage",
  admin: true,
  pm: true
}, {
  id: "clients",
  label: "Clients",
  icon: BriefcaseBusiness,
  group: "Manage",
  pm: true
}, {
  id: "quotations",
  label: "Quotations",
  icon: FileText,
  group: "Finance",
  pm: true
}, {
  id: "invoices",
  label: "Invoices",
  icon: FileText,
  group: "Finance",
  pm: true
}, {
  id: "payments",
  label: "Payments",
  icon: CreditCard,
  group: "Finance",
  pm: true
}, {
  id: "expenses",
  label: "Expenses",
  icon: Wallet,
  group: "Finance",
  pm: true
}, {
  id: "reports",
  label: "Reports & analytics",
  icon: ChartNoAxesCombined,
  group: "Insights"
}, {
  id: "notifications",
  label: "Notifications",
  icon: Bell,
  group: "Insights",
  count: "3"
}, {
  id: "settings",
  label: "Settings & access",
  icon: Settings,
  group: "System",
  admin: true
}];
export const pageTitles = {
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
  settings: "Settings & access"
};
export const pageDescriptions = {
  projects: "Track delivery, crews, budgets, and milestones across your portfolio.",
  assignment: "Match available site work with qualified workers and crews.",
  attendance: "Review location-verified shifts and daily workforce coverage.",
  progress: "Review field updates, submitted photos, and completion requests.",
  users: "Manage your workforce, project managers, and account access.",
  clients: "Keep client contacts, active work, and account value in one place.",
  quotations: "Prepare and track project estimates from draft through approval.",
  invoices: "Monitor due dates, payment progress, and outstanding balances.",
  payments: "Reconcile received payments against project invoices.",
  expenses: "Review job costs and receipts submitted by your team.",
  reports: "Analyze project delivery, workforce, and financial performance.",
  notifications: "Recent updates across projects, attendance, and finance.",
  settings: "Configure workspace access and administrative preferences."
};
export const columnSets = {
  users: ["Name", "Role", "Manager Mapping", "Status", "Added"],
  clients: ["Client", "Primary contact", "Active project", "Contract value"],
  assignment: ["Available project", "Site & distance", "Schedule", "Crew needed", "Status"],
  attendance: ["Worker", "Project", "Check-in", "GPS fix", "Verification"],
  progress: ["Work update", "Submitted by", "Time", "Progress", "Review status"],
  quotations: ["Quotation", "Client", "Project", "Total", "Status"],
  invoices: ["Invoice", "Client", "Issued", "Due date", "Total", "Status"],
  payments: ["Reference", "Client", "Date", "Method", "Amount", "Status"],
  expenses: ["Expense", "Project", "Date", "Category", "Amount", "Approval"],
  notifications: ["Update", "Related record", "Time", "Category"]
};
export const projectTabs = ["Overview", "Assigned Workers", "Attendance", "Daily progress", "Photos & documents", "Quotations & invoices", "Activity history"];
export const projectStatuses = ["Draft", "Open", "Assigned", "In Progress", "Completed", "Closed", "Cancelled"];
export const recordDialogFields = {
  users: [{
    name: "name",
    label: "Full name",
    required: true
  }, {
    name: "email",
    label: "Work email",
    type: "email",
    required: true
  }, {
    name: "role",
    label: "System role",
    type: "select",
    options: [["worker", "Worker"], ["project_manager", "Project manager"], ["admin", "Admin"]]
  }, {
    name: "managerMapping",
    label: "Manager Mapping",
    type: "manager",
    required: true
  }, {
    name: "password",
    label: "Temporary password (6+ characters)",
    type: "password",
    minLength: 6,
    required: true
  }],
  clients: [{
    name: "name",
    label: "Client or organization",
    required: true
  }, {
    name: "contactName",
    label: "Primary contact",
    required: true
  }, {
    name: "email",
    label: "Contact email",
    type: "email"
  }, {
    name: "phone",
    label: "Contact phone",
    type: "tel"
  }],
  quotations: [{
    name: "client",
    label: "Client",
    required: true
  }, {
    name: "project",
    label: "Project reference",
    required: true
  }, {
    name: "item",
    label: "Item description",
    required: true,
    wide: true
  }, {
    name: "labour",
    label: "Labour charges",
    type: "number",
    min: 0,
    defaultValue: "0"
  }, {
    name: "materials",
    label: "Material charges",
    type: "number",
    min: 0,
    defaultValue: "0"
  }, {
    name: "quantity",
    label: "Quantity",
    type: "number",
    min: 0,
    defaultValue: "1"
  }, {
    name: "unitPrice",
    label: "Unit price",
    type: "number",
    min: 0,
    defaultValue: "0"
  }, {
    name: "tax",
    label: "Tax rate (%)",
    type: "number",
    min: 0,
    defaultValue: "0"
  }, {
    name: "discount",
    label: "Discount amount",
    type: "number",
    min: 0,
    defaultValue: "0"
  }, {
    name: "validUntil",
    label: "Valid until",
    type: "date",
    required: true
  }],
  invoices: [{
    name: "client",
    label: "Client",
    required: true
  }, {
    name: "project",
    label: "Project reference",
    required: true
  }, {
    name: "invoiceDate",
    label: "Invoice date",
    type: "date",
    required: true
  }, {
    name: "dueDate",
    label: "Due date",
    type: "date",
    required: true
  }, {
    name: "item",
    label: "Line item description",
    required: true,
    wide: true
  }, {
    name: "labour",
    label: "Labour charges",
    type: "number",
    min: 0,
    defaultValue: "0"
  }, {
    name: "materials",
    label: "Material charges",
    type: "number",
    min: 0,
    defaultValue: "0"
  }, {
    name: "quantity",
    label: "Quantity",
    type: "number",
    min: 0,
    defaultValue: "1"
  }, {
    name: "unitPrice",
    label: "Unit price",
    type: "number",
    min: 0,
    defaultValue: "0"
  }, {
    name: "tax",
    label: "Tax rate (%)",
    type: "number",
    min: 0,
    defaultValue: "0"
  }, {
    name: "discount",
    label: "Discount amount",
    type: "number",
    min: 0,
    defaultValue: "0"
  }],
  payments: [{
    name: "client",
    label: "Client",
    required: true
  }, {
    name: "invoice",
    label: "Invoice reference",
    required: true
  }, {
    name: "project",
    label: "Project ID",
    required: true,
    placeholder: "BLD-2408"
  }, {
    name: "date",
    label: "Payment date",
    type: "date",
    required: true
  }, {
    name: "method",
    label: "Payment method",
    type: "select",
    options: [["ACH transfer", "ACH transfer"], ["Wire transfer", "Wire transfer"], ["Check", "Check"], ["Card", "Card"], ["Cash", "Cash"]]
  }, {
    name: "reference",
    label: "Transaction reference",
    placeholder: "Optional"
  }, {
    name: "amount",
    label: "Amount received",
    type: "number",
    min: 0.01,
    step: "0.01",
    required: true
  }, {
    name: "status",
    label: "Payment status",
    type: "select",
    options: [["Pending", "Pending"], ["Partially Paid", "Partially Paid"], ["Paid", "Paid"], ["Cancelled", "Cancelled"]]
  }],
  expenses: [{
    name: "client",
    label: "Client",
    required: true
  }, {
    name: "description",
    label: "Expense description",
    required: true,
    wide: true
  }, {
    name: "category",
    label: "Category",
    type: "select",
    options: [["Materials", "Materials"], ["Labor", "Labor"], ["Equipment", "Equipment"], ["Safety", "Safety"], ["Travel", "Travel"], ["Other", "Other"]]
  }, {
    name: "project",
    label: "Project ID",
    required: true,
    placeholder: "BLD-2408"
  }, {
    name: "date",
    label: "Expense date",
    type: "date",
    required: true
  }, {
    name: "amount",
    label: "Amount",
    type: "number",
    min: 0.01,
    step: "0.01",
    required: true
  }, {
    name: "receipt",
    label: "Receipt URL",
    type: "url",
    placeholder: "Optional"
  }]
};
export const recordDialogTitles = {
  users: "Invite a team member",
  clients: "Add a client",
  quotations: "Create a quotation",
  invoices: "Create an invoice",
  payments: "Record a payment",
  expenses: "Add an expense"
};
