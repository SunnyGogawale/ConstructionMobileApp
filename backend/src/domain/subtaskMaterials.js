import { z } from 'zod';

const materialFields = {
  name: z.string().trim().min(1).max(180),
  description: z.string().max(3000),
  quantity: z.number().positive().finite(),
  unit: z.string().trim().min(1).max(80),
  unitPrice: z.number().min(0).finite(),
  date: z.coerce.date(),
  notes: z.string().max(2000),
};

export const createSubtaskMaterialSchema = z.object({
  ...materialFields,
  description: materialFields.description.optional().default(''),
  notes: materialFields.notes.optional().default(''),
});
export const updateSubtaskMaterialSchema = z.object({
  name: materialFields.name.optional(),
  description: materialFields.description.optional(),
  quantity: materialFields.quantity.optional(),
  unit: materialFields.unit.optional(),
  unitPrice: materialFields.unitPrice.optional(),
  date: materialFields.date.optional(),
  notes: materialFields.notes.optional(),
}).refine(value => Object.keys(value).length > 0);

export function calculateSubtaskMaterialTotal(quantity, unitPrice) {
  return Math.round((quantity * unitPrice + Number.EPSILON) * 100) / 100;
}
