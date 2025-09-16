import { Team, User, Project } from '../models/index.js';
import { validate, schemas } from '../utils/validation.js';

export const listTeams = async () =>
  Team.findAll({
    include: [
      { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'members', through: { attributes: ['role'] }, attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Project, as: 'projects' }
    ]
  });

export const getTeamById = async (id) => {
  const team = await Team.findByPk(id, {
    include: [
      { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'members', through: { attributes: ['role'] }, attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Project, as: 'projects' }
    ]
  });
  if (!team) {
    const err = new Error('Team not found');
    err.statusCode = 404;
    throw err;
  }
  return team;
};

export const createTeam = async (payload) => {
  const data = validate(schemas.createTeam, payload);
  return Team.create(data);
};

export const updateTeam = async (id, payload) => {
  const data = validate(schemas.updateTeam, payload);
  const team = await getTeamById(id);
  await team.update(data);
  return team;
};

export const deleteTeam = async (id) => {
  const team = await getTeamById(id);
  await team.destroy();
  return true;
};

export const assignUsersToTeam = async (teamId, payload) => {
  const data = validate(schemas.assignUsersToTeam, payload);
  const team = await getTeamById(teamId);
  const users = await User.findAll({ where: { id: data.userIds } });

  if (users.length !== data.userIds.length) {
    const err = new Error('Some users were not found');
    err.statusCode = 400;
    throw err;
  }

  await team.addMembers(users);
  return getTeamById(teamId);
};
