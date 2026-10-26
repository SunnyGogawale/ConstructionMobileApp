import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Subtask from '../models/Subtask.js';

export async function findWorkerAssignedProject(projectId, workerId) {
  const idFilter = mongoose.isValidObjectId(projectId)
    ? { _id: projectId }
    : { projectId };
  const project = await Project.findOne(idFilter);
  if (!project) return null;
  if (String(project.assignedWorker || '') === String(workerId)) return project;

  const assignedSubtask = await Subtask.exists({
    project: project._id,
    assignedWorker: workerId
  });
  return assignedSubtask ? project : null;
}
