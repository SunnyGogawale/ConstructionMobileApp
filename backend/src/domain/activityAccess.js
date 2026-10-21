export function canProjectManagerViewActivity(managerId, person) {
  if (person.role !== 'worker') return false;
  const managerMappings = Array.isArray(person.managerMapping)
    ? person.managerMapping
    : person.managerMapping ? [person.managerMapping] : [];
  if (managerMappings.length) {
    return managerMappings.some(mapping => String(mapping?._id || mapping) === String(managerId));
  }
  return String(person.createdBy || '') === String(managerId);
}
