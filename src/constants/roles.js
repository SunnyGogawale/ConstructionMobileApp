export const ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  WORKER: 'worker',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'System Admin',
  [ROLES.PROJECT_MANAGER]: 'Project Manager',
  [ROLES.WORKER]: 'Field Worker',
};

export const ROLE_COLORS = {
  [ROLES.ADMIN]: '#6b7fa3',
  [ROLES.PROJECT_MANAGER]: '#2d6cdf',
  [ROLES.WORKER]: '#1bb35c',
};

export default ROLES;
