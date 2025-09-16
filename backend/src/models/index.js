import User from './User.js';
import Team from './Team.js';
import Project from './Project.js';
import Task from './Task.js';
import TimeLog from './TimeLog.js';
import TeamMember from './TeamMember.js';
import Screenshot from './Screenshot.js';
import Activity from './Activity.js';
import Shift from './Shift.js';
import Attendance from './Attendance.js';

// Associations
Team.belongsTo(User, { as: 'manager', foreignKey: 'managerId' });
User.hasMany(Team, { as: 'managedTeams', foreignKey: 'managerId' });

User.belongsToMany(Team, { through: TeamMember, as: 'teams', foreignKey: 'userId' });
Team.belongsToMany(User, { through: TeamMember, as: 'members', foreignKey: 'teamId' });
TeamMember.belongsTo(User, { foreignKey: 'userId' });
TeamMember.belongsTo(Team, { foreignKey: 'teamId' });

Project.belongsTo(Team, { as: 'team', foreignKey: 'teamId' });
Team.hasMany(Project, { as: 'projects', foreignKey: 'teamId' });

Task.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
Project.hasMany(Task, { as: 'tasks', foreignKey: 'projectId' });

Task.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' });
User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assigneeId' });

TimeLog.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(TimeLog, { as: 'timeLogs', foreignKey: 'userId' });

TimeLog.belongsTo(Task, { as: 'task', foreignKey: 'taskId' });
Task.hasMany(TimeLog, { as: 'timeLogs', foreignKey: 'taskId' });

Screenshot.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(Screenshot, { as: 'screenshots', foreignKey: 'userId' });

Screenshot.belongsTo(Task, { as: 'task', foreignKey: 'taskId' });
Task.hasMany(Screenshot, { as: 'screenshots', foreignKey: 'taskId' });

Screenshot.belongsTo(TimeLog, { as: 'timeLog', foreignKey: 'timeLogId' });
TimeLog.hasMany(Screenshot, { as: 'screenshots', foreignKey: 'timeLogId' });

Activity.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(Activity, { as: 'activities', foreignKey: 'userId' });

Activity.belongsTo(Task, { as: 'task', foreignKey: 'taskId' });
Task.hasMany(Activity, { as: 'activities', foreignKey: 'taskId' });

Activity.belongsTo(TimeLog, { as: 'timeLog', foreignKey: 'timeLogId' });
TimeLog.hasMany(Activity, { as: 'activities', foreignKey: 'timeLogId' });

Shift.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(Shift, { as: 'shifts', foreignKey: 'userId' });

Attendance.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(Attendance, { as: 'attendanceRecords', foreignKey: 'userId' });

Attendance.belongsTo(Shift, { as: 'shift', foreignKey: 'shiftId' });
Shift.hasMany(Attendance, { as: 'attendanceRecords', foreignKey: 'shiftId' });

export {
  User,
  Team,
  Project,
  Task,
  TimeLog,
  TeamMember,
  Screenshot,
  Activity,
  Shift,
  Attendance
};
