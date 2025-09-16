import {
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  updateProject
} from '../services/projectService.js';
import { USER_ROLES } from '../utils/constants.js';

const ensureManagerOrAdmin = (role) => {
  if (![USER_ROLES.ADMIN, USER_ROLES.MANAGER].includes(role)) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
};

const filterProjectsForEmployee = (projects, userId) =>
  projects.filter((project) => {
    const members = project.team?.members || [];
    const assignees = project.tasks?.map((task) => task.assignee?.id).filter(Boolean) || [];
    return members.some((member) => member.id === userId) || assignees.includes(userId);
  });

export const getProjects = async (req, res) => {
  const projects = await listProjects(req.query);
  const data =
    req.user.role === USER_ROLES.EMPLOYEE
      ? filterProjectsForEmployee(projects, req.user.id)
      : projects;
  res.json({ success: true, data });
};

export const getProject = async (req, res) => {
  const project = await getProjectById(req.params.id);
  if (req.user.role === USER_ROLES.EMPLOYEE) {
    const isAllowed = filterProjectsForEmployee([project], req.user.id).length > 0;
    if (!isAllowed) {
      const err = new Error('Forbidden');
      err.statusCode = 403;
      throw err;
    }
  }
  res.json({ success: true, data: project });
};

export const postProject = async (req, res) => {
  ensureManagerOrAdmin(req.user.role);
  const project = await createProject(req.body);
  res.status(201).json({ success: true, data: project });
};

export const patchProject = async (req, res) => {
  ensureManagerOrAdmin(req.user.role);
  const project = await updateProject(req.params.id, req.body);
  res.json({ success: true, data: project });
};

export const removeProject = async (req, res) => {
  ensureManagerOrAdmin(req.user.role);
  await deleteProject(req.params.id);
  res.status(204).send();
};
