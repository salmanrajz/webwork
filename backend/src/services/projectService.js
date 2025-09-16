import { Project, Team, Task, User } from '../models/index.js';
import { validate, schemas } from '../utils/validation.js';

const projectIncludes = [
  {
    model: Team,
    as: 'team',
    include: [
      {
        model: User,
        as: 'members',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        through: { attributes: [] }
      }
    ]
  },
  {
    model: Task,
    as: 'tasks',
    include: [{ model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] }]
  }
];

export const listProjects = async (query = {}) => {
  const { teamId } = query;
  const where = teamId ? { teamId } : {};
  return Project.findAll({
    where,
    include: projectIncludes
  });
};

export const getProjectById = async (id) => {
  const project = await Project.findByPk(id, {
    include: projectIncludes
  });
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }
  return project;
};

export const createProject = async (payload) => {
  const data = validate(schemas.createProject, payload);
  return Project.create(data);
};

export const updateProject = async (id, payload) => {
  const data = validate(schemas.updateProject, payload);
  const project = await getProjectById(id);
  await project.update(data);
  return project;
};

export const deleteProject = async (id) => {
  const project = await getProjectById(id);
  await project.destroy();
  return true;
};
