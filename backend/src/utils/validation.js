import Joi from 'joi';
import {
  USER_ROLES,
  PROJECT_STATUS,
  TASK_STATUS,
  SHIFT_STATUS,
  ATTENDANCE_STATUS
} from './constants.js';

const id = Joi.string().uuid({ version: 'uuidv4' });

const baseUser = {
  firstName: Joi.string().max(100),
  lastName: Joi.string().max(100),
  email: Joi.string().email(),
  role: Joi.string().valid(...Object.values(USER_ROLES))
};

export const schemas = {
  register: Joi.object({
    ...baseUser,
    firstName: baseUser.firstName.required(),
    lastName: baseUser.lastName.required(),
    email: baseUser.email.required(),
    password: Joi.string().min(8).required(),
    role: baseUser.role.default(USER_ROLES.EMPLOYEE)
  }),
  updateUser: Joi.object({
    ...baseUser,
    isActive: Joi.boolean(),
    password: Joi.string().min(8)
  }).min(1),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  createTeam: Joi.object({
    name: Joi.string().max(120).required(),
    description: Joi.string().allow('', null),
    managerId: id.allow(null)
  }),
  updateTeam: Joi.object({
    name: Joi.string().max(120),
    description: Joi.string().allow('', null),
    managerId: id.allow(null)
  }).min(1),
  createProject: Joi.object({
    name: Joi.string().max(150).required(),
    description: Joi.string().allow('', null),
    status: Joi.string().valid(...Object.values(PROJECT_STATUS)),
    startDate: Joi.date().allow(null),
    endDate: Joi.date().min(Joi.ref('startDate')).allow(null),
    teamId: id.required()
  }),
  updateProject: Joi.object({
    name: Joi.string().max(150),
    description: Joi.string().allow('', null),
    status: Joi.string().valid(...Object.values(PROJECT_STATUS)),
    startDate: Joi.date().allow(null),
    endDate: Joi.date().min(Joi.ref('startDate')).allow(null),
    teamId: id
  }).min(1),
  createTask: Joi.object({
    title: Joi.string().max(150).required(),
    description: Joi.string().allow('', null),
    status: Joi.string().valid(...Object.values(TASK_STATUS)),
    estimatedHours: Joi.number().positive().allow(null),
    dueDate: Joi.date().allow(null),
    projectId: id.required(),
    assigneeId: id.allow(null)
  }),
  updateTask: Joi.object({
    title: Joi.string().max(150),
    description: Joi.string().allow('', null),
    status: Joi.string().valid(...Object.values(TASK_STATUS)),
    estimatedHours: Joi.number().positive().allow(null),
    dueDate: Joi.date().allow(null),
    projectId: id,
    assigneeId: id.allow(null)
  }).min(1),
  timeLog: Joi.object({
    taskId: id.required(),
    startTime: Joi.date().required(),
    endTime: Joi.date().min(Joi.ref('startTime')).allow(null),
    note: Joi.string().allow('', null)
  }),
  updateTimeLog: Joi.object({
    startTime: Joi.date(),
    endTime: Joi.date().min(Joi.ref('startTime')),
    note: Joi.string().allow('', null)
  }).min(1),
  assignUsersToTeam: Joi.object({
    userIds: Joi.array().items(id).min(1).required()
  }),
  assignTasks: Joi.object({
    taskIds: Joi.array().items(id).min(1).required(),
    assigneeId: id.required()
  }),
  createScreenshot: Joi.object({
    capturedAt: Joi.date(),
    note: Joi.string().allow('', null),
    taskId: id.allow(null),
    timeLogId: id.allow(null)
  }),
  filterScreenshots: Joi.object({
    userId: id.allow(null),
    taskId: id.allow(null),
    from: Joi.date().allow(null),
    to: Joi.date().allow(null)
  }),
  createActivities: Joi.array()
    .items(
      Joi.object({
        capturedAt: Joi.date().required(),
        durationSeconds: Joi.number().integer().min(1).default(15),
        windowTitle: Joi.string().allow('', null),
        appName: Joi.string().allow('', null),
        url: Joi.string().allow('', null),
        idleSeconds: Joi.number().integer().min(0).default(0),
        activityScore: Joi.number().min(0).max(1).default(1),
        cpuUsage: Joi.number().min(0).max(100).default(0),
        keyboardCount: Joi.number().integer().min(0).default(0),
        mouseCount: Joi.number().integer().min(0).default(0),
        keystrokes: Joi.array()
          .items(
            Joi.object({
              key: Joi.string().allow('', null),
              keyCode: Joi.number().integer().allow(null),
              timestamp: Joi.date().allow(null)
            })
          )
          .default([]),
        taskId: id.allow(null),
        timeLogId: id.allow(null)
      })
    )
    .min(1),
  createShift: Joi.object({
    userId: id.required(),
    startTime: Joi.date().required(),
    endTime: Joi.date().greater(Joi.ref('startTime')).required(),
    status: Joi.string().valid(...Object.values(SHIFT_STATUS)),
    notes: Joi.string().allow('', null)
  }),
  updateShift: Joi.object({
    startTime: Joi.date(),
    endTime: Joi.date().greater(Joi.ref('startTime')),
    status: Joi.string().valid(...Object.values(SHIFT_STATUS)),
    notes: Joi.string().allow('', null)
  }).min(1),
  clockIn: Joi.object({
    shiftId: id.allow(null),
    clockIn: Joi.date(),
    status: Joi.string().valid(...Object.values(ATTENDANCE_STATUS)),
    notes: Joi.string().allow('', null)
  }),
  clockOut: Joi.object({
    clockOut: Joi.date(),
    notes: Joi.string().allow('', null)
  }),
  filterAttendance: Joi.object({
    userId: id.allow(null),
    shiftId: id.allow(null),
    from: Joi.date().allow(null),
    to: Joi.date().allow(null)
  })
};

export const validate = (schema, payload) => {
  const { error, value } = schema.validate(payload, { abortEarly: false, stripUnknown: true });
  if (error) {
    const err = new Error('Validation error');
    err.statusCode = 400;
    err.details = error.details.map((d) => d.message);
    throw err;
  }
  return value;
};
