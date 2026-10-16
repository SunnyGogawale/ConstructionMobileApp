import { Router } from 'express';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import FinanceRecord from '../models/FinanceRecord.js';
import Project from '../models/Project.js';
import { allowRoles } from '../middleware/auth.js';
import { calculateFinanceTotal } from '../domain/finance.js';

const router = Router();
const amount = z.number().finite().min(0);
const shared = {
  client: z.string().trim().min(1).max(180),
  projectId: z.string().min(1),
  description: z.string().trim().min(2).max(1000),
};
const schemas = {
  quotation: z.object({ ...shared, labourCharges: amount.default(0), materialCharges: amount.default(0), quantity: amount.default(1), unitPrice: amount.default(0), taxRate: amount.default(0), discount: amount.default(0), validUntil: z.coerce.date() }),
  invoice: z.object({ ...shared, labourCharges: amount.default(0), materialCharges: amount.default(0), quantity: amount.default(1), unitPrice: amount.default(0), taxRate: amount.default(0), discount: amount.default(0), issueDate: z.coerce.date(), dueDate: z.coerce.date() }),
  payment: z.object({ client: z.string().trim().min(1), projectId: z.string().min(1), description: z.string().trim().min(1).max(1000), amountReceived: z.number().finite().positive(), paymentMethod: z.string().trim().min(1).max(80), transactionReference: z.string().max(180).optional(), paidAt: z.coerce.date(), status: z.enum(['Pending', 'Partially Paid', 'Paid', 'Cancelled']) }),
  expense: z.object({ ...shared, category: z.string().trim().min(1).max(80), total: z.number().finite().positive(), issueDate: z.coerce.date(), receiptUrl: z.url().optional().or(z.literal('')) }),
};
const prefix = { quotation: 'QUO', invoice: 'INV', payment: 'PAY', expense: 'EXP' };

async function findProject(projectId, user) {
  const filter = mongoose.isValidObjectId(projectId) ? { _id: projectId } : { projectId };
  const project = await Project.findOne(filter).select('_id projectId name manager');
  if (!project || (user.role === 'project_manager' && String(project.manager) !== user.id)) return null;
  return project;
}

router.get('/', allowRoles('admin', 'project_manager'), async (req, res) => {
  const type = req.query.type;
  if (type && !Object.hasOwn(prefix, type)) return res.status(400).json({ message: 'Finance record type is invalid.' });
  let projectIds;
  if (req.user.role === 'project_manager') projectIds = await Project.find({ manager: req.user.id }).distinct('_id');
  const filter = { ...(type ? { recordType: type } : {}), ...(projectIds ? { project: { $in: projectIds } } : {}) };
  const records = await FinanceRecord.find(filter).sort({ createdAt: -1 }).limit(250).populate('createdBy', 'name').populate('project', 'projectId name');
  return res.json({ records });
});

router.post('/:type', allowRoles('admin', 'project_manager'), async (req, res) => {
  const { type } = req.params;
  if (!Object.hasOwn(schemas, type)) return res.status(404).json({ message: 'Finance record type not found.' });
  const parsed = schemas[type].safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Finance record details are invalid.', errors: parsed.error.issues });
  const project = await findProject(parsed.data.projectId, req.user);
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  const data = parsed.data;
  const common = {
    recordType: type,
    reference: `${prefix[type]}-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    client: data.client,
    project: project._id,
    projectReference: project.projectId,
    description: data.description,
    createdBy: req.user.id,
  };
  let recordData;
  if (type === 'quotation' || type === 'invoice') {
    const totals = calculateFinanceTotal(data);
    recordData = {
      ...common, ...totals,
      lineItems: [{ description: data.description, quantity: data.quantity, unitPrice: data.unitPrice }],
      labourCharges: data.labourCharges, materialCharges: data.materialCharges,
      taxRate: data.taxRate, discount: data.discount,
      status: type === 'quotation' ? 'Draft' : 'Pending',
      issueDate: type === 'invoice' ? data.issueDate : undefined,
      dueDate: type === 'invoice' ? data.dueDate : undefined,
      validUntil: type === 'quotation' ? data.validUntil : undefined,
    };
  } else if (type === 'payment') {
    recordData = { ...common, total: data.amountReceived, amountReceived: data.amountReceived, paymentMethod: data.paymentMethod, transactionReference: data.transactionReference || '', paidAt: data.paidAt, status: data.status };
  } else {
    recordData = { ...common, total: data.total, category: data.category, issueDate: data.issueDate, receiptUrl: data.receiptUrl || '', status: 'Pending approval' };
  }
  const record = await FinanceRecord.create(recordData);
  return res.status(201).json({ record });
});

export default router;
