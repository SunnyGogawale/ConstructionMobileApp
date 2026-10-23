import { csvCell } from './activityExport.js';

export const PROJECT_EXPORT_HEADERS = [
  'Project ID',
  'Project Name',
  'Client',
  'Address',
  'Status',
  'Priority',
  'Start Date',
  'End Date',
  'Budget',
  'Progress',
  'Project Manager',
  'Assigned Worker',
  'Assigned Project Managers',
];

export function projectCsvRow(project, role, progress = project.progress) {
  return `${[
    project.projectId,
    project.name,
    project.client?.name,
    project.address,
    project.status,
    project.priority,
    project.startDate?.toISOString?.() || project.startDate,
    project.endDate?.toISOString?.() || project.endDate,
    project.budget,
    progress,
    project.manager?.name,
    project.assignedWorker?.name,
    role === 'admin' ? project.assignedManagers?.map(manager => manager.name).join(', ') : '',
  ].map(csvCell).join(',')}\r\n`;
}
