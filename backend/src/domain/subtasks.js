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
