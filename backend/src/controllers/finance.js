import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import FinanceRecord from '../models/FinanceRecord.js';
import Project from '../models/Project.js';
import { calculateFinanceTotal } from '../domain/finance.js';
const amount = z.number().finite().min(0);
const shared = {
  client: z.string().trim().min(1).max(180),
  projectId: z.string().min(1),
  description: z.string().trim().min(2).max(1000)
};
const schemas = {
  quotation: z.object({
    ...shared,
    labourCharges: amount.default(0),
    materialCharges: amount.default(0),
    quantity: amount.default(1),
    unitPrice: amount.default(0),
    taxRate: amount.default(0),
    discount: amount.default(0),
    validUntil: z.coerce.date()
  }),
  invoice: z.object({
    ...shared,
    labourCharges: amount.default(0),
    materialCharges: amount.default(0),
    quantity: amount.default(1),
    unitPrice: amount.default(0),
    taxRate: amount.default(0),
    discount: amount.default(0),
    issueDate: z.coerce.date(),
    dueDate: z.coerce.date()
  }),
  payment: z.object({
    client: z.string().trim().min(1),
    projectId: z.string().min(1),
    description: z.string().trim().min(1).max(1000),
    amountReceived: z.number().finite().positive(),
    paymentMethod: z.string().trim().min(1).max(80),
    transactionReference: z.string().max(180).optional(),
    paidAt: z.coerce.date(),
    status: z.enum(['Pending', 'Partially Paid', 'Paid', 'Cancelled'])
  }),
  expense: z.object({
    ...shared,
    category: z.string().trim().min(1).max(80),
    total: z.number().finite().positive(),
    issueDate: z.coerce.date(),
    receiptUrl: z.url().optional().or(z.literal(''))
  })
};
const updateSchemas = Object.fromEntries(Object.entries(schemas).map(([type, schema]) => [type, schema.partial().strict().refine(value => Object.keys(value).length > 0)]));
const prefix = {
  quotation: 'QUO',
  invoice: 'INV',
  payment: 'PAY',
  expense: 'EXP'
};
async function findProject(projectId, user) {
  const filter = mongoose.isValidObjectId(projectId) ? {
    _id: projectId
  } : {
    projectId
  };
  const project = await Project.findOne(filter).select('_id projectId name manager');
  if (!project || user.role === 'project_manager' && String(project.manager) !== user.id) return null;
  return project;
}
export const handleGetRoot = async (req, res) => {
  const type = req.query.type;
  if (type && !Object.hasOwn(prefix, type)) return res.status(400).json({
    message: 'Finance record type is invalid.'
  });
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  let projectIds;
  if (req.user.role === 'project_manager') projectIds = await Project.find({
    manager: req.user.id
  }).distinct('_id');
  const clauses = [];
  if (type) clauses.push({
    recordType: type
  });
  if (projectIds) clauses.push({
    project: {
      $in: projectIds
    }
  });
  if (req.query.projectId) {
    const id = String(req.query.projectId);
    const project = await Project.findOne(mongoose.isValidObjectId(id) ? {
      _id: id
    } : {
      projectId: id
    }).select('_id manager');
    if (!project || req.user.role === 'project_manager' && String(project.manager) !== req.user.id) {
      return res.status(404).json({
        message: 'Project not found.'
      });
    }
    clauses.push({
      project: project._id
    });
  }
  const search = String(req.query.search || '').trim();
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'i');
    clauses.push({
      $or: [{
        reference: pattern
      }, {
        client: pattern
      }, {
        description: pattern
      }, {
        status: pattern
      }, {
        projectReference: pattern
      }]
    });
  }
  const filter = clauses.length ? {
    $and: clauses
  } : {};
  const sortFields = new Set(['createdAt', 'issueDate', 'dueDate', 'paidAt', 'total', 'status', 'reference']);
  const sortBy = sortFields.has(String(req.query.sortBy)) ? String(req.query.sortBy) : 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const [records, total] = await Promise.all([FinanceRecord.find(filter).sort({
    [sortBy]: sortOrder
  }).skip((page - 1) * limit).limit(limit).populate('createdBy', 'name').populate('project', 'projectId name'), FinanceRecord.countDocuments(filter)]);
  return res.json({
    records,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
};
export const handlePostRoot = async (req, res) => {
  const {
    type
  } = req.params;
  if (!Object.hasOwn(schemas, type)) return res.status(404).json({
    message: 'Finance record type not found.'
  });
  const parsed = schemas[type].safeParse(req.body);
  if (!parsed.success) return res.status(400).json({
    message: 'Finance record details are invalid.',
    errors: parsed.error.issues
  });
  const project = await findProject(parsed.data.projectId, req.user);
  if (!project) return res.status(404).json({
    message: 'Project not found.'
  });
  const data = parsed.data;
  const common = {
    recordType: type,
    reference: `${prefix[type]}-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    client: data.client,
    project: project._id,
    projectReference: project.projectId,
    description: data.description,
    createdBy: req.user.id
  };
  let recordData;
  if (type === 'quotation' || type === 'invoice') {
    const totals = calculateFinanceTotal(data);
    recordData = {
      ...common,
      ...totals,
      lineItems: [{
        description: data.description,
        quantity: data.quantity,
        unitPrice: data.unitPrice
      }],
      labourCharges: data.labourCharges,
      materialCharges: data.materialCharges,
      taxRate: data.taxRate,
      discount: data.discount,
      status: type === 'quotation' ? 'Draft' : 'Pending',
      issueDate: type === 'invoice' ? data.issueDate : undefined,
      dueDate: type === 'invoice' ? data.dueDate : undefined,
      validUntil: type === 'quotation' ? data.validUntil : undefined
    };
  } else if (type === 'payment') {
    recordData = {
      ...common,
      total: data.amountReceived,
      amountReceived: data.amountReceived,
      paymentMethod: data.paymentMethod,
      transactionReference: data.transactionReference || '',
      paidAt: data.paidAt,
      status: data.status
    };
  } else {
    recordData = {
      ...common,
      total: data.total,
      category: data.category,
      issueDate: data.issueDate,
      receiptUrl: data.receiptUrl || '',
      status: 'Pending approval'
    };
  }
  const record = await FinanceRecord.create(recordData);
  return res.status(201).json({
    record
  });
};
export const handlePatchRoot = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({
    message: 'Finance record not found.'
  });
  const record = await FinanceRecord.findById(req.params.id).populate('project', 'manager');
  if (!record || req.user.role === 'project_manager' && String(record.project?.manager) !== req.user.id) {
    return res.status(404).json({
      message: 'Finance record not found.'
    });
  }
  if (record.recordType === 'payment') return res.status(409).json({
    message: 'Payment records are immutable to preserve transaction history.'
  });
  const editable = record.recordType === 'quotation' ? record.status === 'Draft' : record.recordType === 'invoice' ? record.status === 'Pending' && record.amountReceived === 0 : record.status === 'Pending approval';
  if (!editable) return res.status(409).json({
    message: 'This finance record can no longer be edited.'
  });
  const parsed = updateSchemas[record.recordType].safeParse(req.body);
  if (!parsed.success) return res.status(400).json({
    message: 'Finance record updates are invalid.',
    errors: parsed.error.issues
  });
  const data = parsed.data;
  let project = null;
  if (data.projectId) {
    project = await findProject(data.projectId, req.user);
    if (!project) return res.status(404).json({
      message: 'Project not found.'
    });
  }
  if (record.recordType === 'quotation' || record.recordType === 'invoice') {
    const quantity = data.quantity ?? record.lineItems[0]?.quantity ?? 1;
    const unitPrice = data.unitPrice ?? record.lineItems[0]?.unitPrice ?? 0;
    const description = data.description ?? record.description;
    const totals = calculateFinanceTotal({
      labourCharges: data.labourCharges ?? record.labourCharges,
      materialCharges: data.materialCharges ?? record.materialCharges,
      quantity,
      unitPrice,
      taxRate: data.taxRate ?? record.taxRate,
      discount: data.discount ?? record.discount
    });
    Object.assign(record, {
      ...(data.client ? {
        client: data.client
      } : {}),
      ...(project ? {
        project: project._id,
        projectReference: project.projectId
      } : {}),
      description,
      ...totals,
      lineItems: [{
        description,
        quantity,
        unitPrice
      }],
      ...(record.recordType === 'quotation' && data.validUntil ? {
        validUntil: data.validUntil
      } : {}),
      ...(record.recordType === 'invoice' && data.issueDate ? {
        issueDate: data.issueDate
      } : {}),
      ...(record.recordType === 'invoice' && data.dueDate ? {
        dueDate: data.dueDate
      } : {})
    });
    if (record.recordType === 'invoice' && record.issueDate && record.dueDate && record.dueDate < record.issueDate) {
      return res.status(400).json({
        message: 'Invoice due date must be on or after its issue date.'
      });
    }
  } else {
    Object.assign(record, {
      ...(data.client ? {
        client: data.client
      } : {}),
      ...(project ? {
        project: project._id,
        projectReference: project.projectId
      } : {}),
      ...(data.description ? {
        description: data.description
      } : {}),
      ...(data.category ? {
        category: data.category
      } : {}),
      ...(data.total !== undefined ? {
        total: data.total
      } : {}),
      ...(data.issueDate ? {
        issueDate: data.issueDate
      } : {}),
      ...(data.receiptUrl !== undefined ? {
        receiptUrl: data.receiptUrl
      } : {})
    });
  }
  await record.save();
  return res.json({
    record
  });
};
export const handleDeleteRoot = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({
    message: 'Finance record not found.'
  });
  const record = await FinanceRecord.findById(req.params.id).populate('project', 'manager');
  if (!record || req.user.role === 'project_manager' && String(record.project?.manager) !== req.user.id) {
    return res.status(404).json({
      message: 'Finance record not found.'
    });
  }
  const cancellable = record.recordType === 'quotation' && record.status === 'Draft' || record.recordType === 'invoice' && record.status === 'Pending' && record.amountReceived === 0 || record.recordType === 'expense' && record.status === 'Pending approval';
  if (!cancellable) return res.status(409).json({
    message: 'This finance record cannot be cancelled without affecting transaction history.'
  });
  record.status = 'Cancelled';
  await record.save();
  return res.json({
    record,
    cancelled: true
  });
};
