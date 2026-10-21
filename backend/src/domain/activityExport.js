export const ACTIVITY_EXPORT_HEADERS = [
  'Date & Time',
  'Person Name',
  'Action',
  'Description',
  'IP Address',
  'Device Information',
  'Status',
];

export function csvCell(value) {
  const text = value == null ? '' : String(value);
  const safeText = /^[\u0000-\u0020]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

export function activityCsvRow(values) {
  return `${values.map(csvCell).join(',')}\r\n`;
}
