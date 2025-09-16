import { fn, col } from 'sequelize';
import { USER_ROLES } from '../utils/constants.js';
import { User, Team, Project, Task, TimeLog } from '../models/index.js';

export const getAdminDashboard = async (req, res) => {
  if (req.user.role !== USER_ROLES.ADMIN) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  const [users, teams, projects, tasks] = await Promise.all([
    User.count(),
    Team.count(),
    Project.count(),
    Task.count()
  ]);

  const totalMinutes = await TimeLog.sum('durationMinutes');

  const hoursByProject = await TimeLog.findAll({
    attributes: [
      [col('task.project_id'), 'projectId'],
      [fn('sum', col('duration_minutes')), 'minutes']
    ],
    include: [{ model: Task, as: 'task', attributes: [] }],
    group: ['task.project_id'],
    order: [[fn('sum', col('duration_minutes')), 'DESC']],
    limit: 5
  });

  const hoursByUser = await TimeLog.findAll({
    attributes: [
      [col('user_id'), 'userId'],
      [fn('sum', col('duration_minutes')), 'minutes']
    ],
    group: ['user_id'],
    order: [[fn('sum', col('duration_minutes')), 'DESC']],
    limit: 5
  });

  const projectIds = hoursByProject.map((row) => row.get('projectId')).filter(Boolean);
  const userIds = hoursByUser.map((row) => row.get('userId')).filter(Boolean);

  const [projectRecords, userRecords] = await Promise.all([
    projectIds.length ? Project.findAll({ where: { id: projectIds } }) : [],
    userIds.length ? User.findAll({ where: { id: userIds } }) : []
  ]);

  const projectMap = new Map(projectRecords.map((project) => [project.id, project.name]));
  const userMap = new Map(
    userRecords.map((member) => [member.id, `${member.firstName} ${member.lastName}`.trim()])
  );

  res.json({
    success: true,
    data: {
      totals: {
        users,
        teams,
        projects,
        tasks,
        totalHours: Number(((totalMinutes || 0) / 60).toFixed(2))
      },
      topProjects: hoursByProject.map((row) => ({
        projectId: row.get('projectId'),
        projectName: projectMap.get(row.get('projectId')) || row.get('projectId'),
        hours: Number((Number(row.get('minutes') || 0) / 60).toFixed(2))
      })),
      topUsers: hoursByUser.map((row) => ({
        userId: row.get('userId'),
        userName: userMap.get(row.get('userId')) || row.get('userId'),
        hours: Number((Number(row.get('minutes') || 0) / 60).toFixed(2))
      }))
    }
  });
};
