export const displayDate = value => value ? new Date(value).toLocaleDateString() : "—";
export const displayDateTime = value => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};
export const displayMoney = value => `$${(Number(value) || 0).toLocaleString("en-US", {
  maximumFractionDigits: 2
})}`;
export function mapProject(project) {
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
    image: project.coverImage || ""
  };
}
export function managerList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}
export function isMappedToManager(user, managerId) {
  const mappings = managerList(user?.managerMapping);
  if (mappings.length) {
    return mappings.some(manager => String(manager?._id || manager?.id || manager) === String(managerId));
  }
  return String(user?.createdBy || "") === String(managerId);
}
export function mapModuleRows(page, payload) {
  if (page === "assignment") return (payload.projects || []).map(project => [project.name, project.address, `${displayDate(project.startDate)} – ${displayDate(project.endDate)}`, project.assignedWorker?.name || "Crew needed", project.status]);
  if (page === "users") return (payload.users || []).map(user => Object.assign([user.name, user.role === "project_manager" ? "Project manager" : user.role, user.role === "worker" ? managerList(user.managerMapping).map(manager => manager.name).filter(Boolean).join(", ") || "Unassigned" : "—", user.active ? "Active" : "Inactive", displayDate(user.createdAt)], {
    userId: user._id || user.id,
    userRole: user.role,
    userActive: Boolean(user.active),
    managerMappingIds: managerList(user.managerMapping).map(manager => manager?._id || manager?.id || manager).filter(Boolean),
    createdById: user.createdBy || ""
  }));
  if (page === "clients") return (payload.clients || []).map(client => [client.name, client.contactName || "—", client.contactEmail || client.contactPhone || "—", client.active ? "Active" : "Inactive"]);
  if (page === "attendance") return (payload.attendance || []).map(item => {
    const location = item.checkInLocation;
    const isNumber = value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
    const hasGpsFix = location
      && [location.latitude, location.longitude, location.accuracyMetres, location.distanceMetres].every(isNumber)
      && Number(location.latitude) >= -90 && Number(location.latitude) <= 90
      && Number(location.longitude) >= -180 && Number(location.longitude) <= 180
      && Number(location.accuracyMetres) > 0
      && Number(location.distanceMetres) >= 0;
    const radius = item.project?.location?.radiusMetres;
    const gpsStatus = !hasGpsFix ? "—" : isNumber(radius)
      && Number(location.accuracyMetres) <= Number(radius)
      && Number(location.distanceMetres) <= Number(radius)
      ? "Verified" : "Fix recorded";
    return Object.assign([
      item.worker?.name || "Worker",
      item.project?.name || item.project?.projectId || "—",
      displayDateTime(item.checkedInAt),
      displayDateTime(item.checkedOutAt),
      gpsStatus
    ], { attendanceRecord: item });
  });
  if (page === "progress") return (payload.updates || []).map(item => [item.description, item.worker?.name || "Worker", displayDate(item.createdAt), `${item.progress}%`, item.reviewStatus]);
  if (page === "notifications") return (payload.notifications || []).map(item => [item.title, item.project?.name || item.message, displayDate(item.createdAt), item.category]);
  const recordType = {
    quotations: "quotation",
    invoices: "invoice",
    payments: "payment",
    expenses: "expense"
  }[page];
  if (recordType) return (payload.records || []).map(item => {
    if (page === "quotations") return [item.reference, item.client, item.project?.name || item.projectReference, displayMoney(item.total), item.status];
    if (page === "invoices") return [item.reference, item.client, displayDate(item.issueDate), displayDate(item.dueDate), displayMoney(item.total), item.status];
    if (page === "payments") return [item.reference, item.client, displayDate(item.paidAt), item.paymentMethod, displayMoney(item.amountReceived), item.status];
    return [item.description, item.project?.name || item.projectReference, displayDate(item.issueDate), item.category, displayMoney(item.total), item.status];
  });
  return [];
}
