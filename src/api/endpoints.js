const AUTH = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
};

const USERS = {
  LIST: '/users',
  CREATE: '/users',
  DETAIL: id => `/users/${id}`,
  UPDATE: id => `/users/${id}`,
  DELETE: id => `/users/${id}`,
};

const PROJECTS = {
  LIST: '/projects',
  CREATE: '/projects',
  DETAIL: id => `/projects/${id}`,
  UPDATE: id => `/projects/${id}`,
  DELETE: id => `/projects/${id}`,
};

const REPORTS = {
  LIST: '/reports',
  GENERATE: '/reports/generate',
  DETAIL: id => `/reports/${id}`,
};

const ATTENDANCE = {
  CHECK_IN: '/attendance/check-in',
  CHECK_OUT: '/attendance/check-out',
  TAKE_BREAK: '/attendance/break',
  MY_RECORDS: '/attendance/me',
};

export const ENDPOINTS = {
  AUTH,
  USERS,
  PROJECTS,
  REPORTS,
  ATTENDANCE,
};

export default ENDPOINTS;
