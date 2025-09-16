import { Op } from 'sequelize';
import {
  User,
  TimeLog,
  Task,
  Project,
  Attendance,
  Activity
} from '../models/index.js';

const ONLINE_IDLE_THRESHOLD = 0.5; // activity score below this is considered non-productive

export const getRealtimeSnapshot = async () => {
  const users = await User.findAll({
    attributes: ['id', 'firstName', 'lastName', 'email'],
    include: [
      {
        model: TimeLog,
        as: 'timeLogs',
        where: { endTime: null },
        required: false,
        separate: true,
        limit: 1,
        order: [['startTime', 'DESC']],
        include: [
          {
            model: Task,
            as: 'task',
            include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }]
          }
        ]
      },
      {
        model: Attendance,
        as: 'attendanceRecords',
        where: { clockOut: null },
        required: false,
        separate: true,
        limit: 1,
        order: [['clockIn', 'DESC']]
      }
    ],
    order: [['firstName', 'ASC']]
  });

  const recentActivities = await Activity.findAll({
    order: [['capturedAt', 'DESC']],
    limit: 200
  });

  const latestActivityByUser = new Map();
  recentActivities.forEach((activity) => {
    if (!latestActivityByUser.has(activity.userId)) {
      latestActivityByUser.set(activity.userId, activity);
    }
  });

  const members = users.map((user) => {
    const activeLog = user.timeLogs?.[0] || null;
    const activeAttendance = user.attendanceRecords?.[0] || null;
    const activity = latestActivityByUser.get(user.id) || null;

    let status = 'absent';
    if (activeLog) {
      status = activity && activity.activityScore < ONLINE_IDLE_THRESHOLD ? 'non_productive' : 'online';
    } else if (activeAttendance) {
      status = 'idle';
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      project: activeLog?.task?.project ? activeLog.task.project.name : null,
      task: activeLog?.task ? activeLog.task.title : null,
      tracker: activeLog ? 'Desktop' : null,
      appName: activity?.appName || null,
      windowTitle: activity?.windowTitle || null,
      activityScore: activity?.activityScore || 0,
      capturedAt: activity?.capturedAt || null,
      attendanceSince: activeAttendance?.clockIn || null,
      keyboardCount: activity?.keyboardCount || 0,
      mouseCount: activity?.mouseCount || 0,
      keystrokes: activity?.keystrokes || [],
      status
    };
  });

  const summary = members.reduce(
    (acc, member) => {
      if (member.status === 'online') acc.workingNow += 1;
      if (member.status === 'non_productive') acc.nonProductive += 1;
      if (member.status === 'absent') acc.absent += 1;
      return acc;
    },
    { workingNow: 0, nonProductive: 0, absent: 0 }
  );

  summary.totalMembers = members.length;

  return {
    summary,
    members
  };
};
