import { z } from 'zod';

export const subtaskStatuses = ['Pending', 'In Progress', 'Completed'];

export const createSubtaskSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().max(3000).optional().default(''),
  assignedWorker: z.string().min(1),
  startDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  status: z.enum(subtaskStatuses).default('Pending'),
});

export const updateSubtaskSchema = createSubtaskSchema.partial().refine(value => Object.keys(value).length > 0);

export function isValidSubtaskDateRange(startDate, dueDate) {
  return dueDate >= startDate;
}

export function validateWorkerTaskTransition({ currentStatus, nextStatus, taskAttendanceId, activeAttendanceId }) {
  if (nextStatus === 'In Progress') {
    return currentStatus === 'Pending' ? null : 'This task has already been started.';
  }
  if (nextStatus === 'Completed') {
    if (currentStatus !== 'In Progress') return 'Start the task with a check-in selfie before completing it.';
    if (!activeAttendanceId || String(taskAttendanceId) !== String(activeAttendanceId)) {
      return 'The task must be completed during the same verified project shift in which it was started.';
    }
    return null;
  }
  return 'Subtask status is invalid.';
}
