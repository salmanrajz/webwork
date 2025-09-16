import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import sequelize from '../config/database.js';
import { USER_ROLES, PROJECT_STATUS, TASK_STATUS } from '../utils/constants.js';
import { User, Team, Project, Task, TimeLog } from '../models/index.js';

dotenv.config();

const hash = (password) => bcrypt.hash(password, 10);

const minutesToDate = (start, minutes) => {
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + minutes);
  return end;
};

const seed = async () => {
  try {
    await sequelize.sync({ force: true });

    const [admin, manager, employee1, employee2, employee3] = await Promise.all([
      User.create({
        firstName: 'Alice',
        lastName: 'Admin',
        email: 'admin@webwork.dev',
        role: USER_ROLES.ADMIN,
        passwordHash: await hash('Password123!')
      }),
      User.create({
        firstName: 'Michael',
        lastName: 'Manager',
        email: 'manager@webwork.dev',
        role: USER_ROLES.MANAGER,
        passwordHash: await hash('Password123!')
      }),
      User.create({
        firstName: 'Emma',
        lastName: 'Employee',
        email: 'emma@webwork.dev',
        role: USER_ROLES.EMPLOYEE,
        passwordHash: await hash('Password123!')
      }),
      User.create({
        firstName: 'James',
        lastName: 'Developer',
        email: 'james@webwork.dev',
        role: USER_ROLES.EMPLOYEE,
        passwordHash: await hash('Password123!')
      }),
      User.create({
        firstName: 'Sophia',
        lastName: 'Designer',
        email: 'sophia@webwork.dev',
        role: USER_ROLES.EMPLOYEE,
        passwordHash: await hash('Password123!')
      })
    ]);

    const productTeam = await Team.create({
      name: 'Product Team',
      description: 'Builds the product features',
      managerId: manager.id
    });

    await productTeam.addMembers([manager, employee1, employee2, employee3]);

    const marketingTeam = await Team.create({
      name: 'Marketing Team',
      description: 'Handles marketing campaigns',
      managerId: admin.id
    });

    await marketingTeam.addMembers([admin, employee3]);

    const webAppProject = await Project.create({
      name: 'Web App Redesign',
      description: 'Revamp the main web application UI/UX',
      status: PROJECT_STATUS.ACTIVE,
      startDate: new Date(),
      teamId: productTeam.id
    });

    const onboardingProject = await Project.create({
      name: 'Onboarding Automation',
      description: 'Automate new user onboarding flows',
      status: PROJECT_STATUS.PLANNED,
      teamId: productTeam.id
    });

    const landingProject = await Project.create({
      name: 'Landing Page Optimization',
      description: 'Improve conversions on marketing pages',
      status: PROJECT_STATUS.ACTIVE,
      teamId: marketingTeam.id
    });

    const [designTask, frontendTask, backendTask] = await Promise.all([
      Task.create({
        title: 'Design dashboard wireframes',
        description: 'Create modern dashboard wireframes',
        status: TASK_STATUS.IN_PROGRESS,
        projectId: webAppProject.id,
        assigneeId: employee3.id,
        estimatedHours: 12,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      }),
      Task.create({
        title: 'Implement dashboard UI',
        description: 'Build React components with Tailwind',
        status: TASK_STATUS.TODO,
        projectId: webAppProject.id,
        assigneeId: employee1.id,
        estimatedHours: 30,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      }),
      Task.create({
        title: 'API for time tracking',
        description: 'Create REST endpoints for time logs',
        status: TASK_STATUS.IN_PROGRESS,
        projectId: onboardingProject.id,
        assigneeId: employee2.id,
        estimatedHours: 24,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
    ]);

    const logs = [
      {
        userId: employee3.id,
        taskId: designTask.id,
        start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        minutes: 180,
        note: 'Initial wireframe exploration'
      },
      {
        userId: employee1.id,
        taskId: frontendTask.id,
        start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        minutes: 240,
        note: 'Built layout components'
      },
      {
        userId: employee2.id,
        taskId: backendTask.id,
        start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        minutes: 210,
        note: 'Created initial endpoints'
      }
    ];

    await Promise.all(
      logs.map((log) =>
        TimeLog.create({
          userId: log.userId,
          taskId: log.taskId,
          startTime: log.start,
          endTime: minutesToDate(log.start, log.minutes),
          note: log.note
        })
      )
    );

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed database', error);
    process.exit(1);
  }
};

seed();
