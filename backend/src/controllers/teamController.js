import {
  assignUsersToTeam,
  createTeam,
  deleteTeam,
  getTeamById,
  listTeams,
  updateTeam
} from '../services/teamService.js';
import { USER_ROLES } from '../utils/constants.js';

const ensureManagerOrAdmin = (role) => {
  if (![USER_ROLES.ADMIN, USER_ROLES.MANAGER].includes(role)) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
};

export const getTeams = async (req, res) => {
  const teams = await listTeams();
  res.json({ success: true, data: teams });
};

export const getTeam = async (req, res) => {
  const team = await getTeamById(req.params.id);
  if (req.user.role === USER_ROLES.EMPLOYEE) {
    const members = team.members || [];
    const isMember = members.some((member) => member.id === req.user.id);
    if (!isMember) {
      const err = new Error('Forbidden');
      err.statusCode = 403;
      throw err;
    }
  }
  res.json({ success: true, data: team });
};

export const postTeam = async (req, res) => {
  ensureManagerOrAdmin(req.user.role);
  const team = await createTeam(req.body);
  res.status(201).json({ success: true, data: team });
};

export const patchTeam = async (req, res) => {
  ensureManagerOrAdmin(req.user.role);
  const team = await updateTeam(req.params.id, req.body);
  res.json({ success: true, data: team });
};

export const removeTeam = async (req, res) => {
  ensureManagerOrAdmin(req.user.role);
  await deleteTeam(req.params.id);
  res.status(204).send();
};

export const postTeamMembers = async (req, res) => {
  ensureManagerOrAdmin(req.user.role);
  const team = await assignUsersToTeam(req.params.id, req.body);
  res.json({ success: true, data: team });
};
