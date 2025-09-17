import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { USER_ROLES } from '../utils/constants.js';

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM(...Object.values(USER_ROLES)),
      defaultValue: USER_ROLES.EMPLOYEE
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    breakReminderInterval: {
      type: DataTypes.INTEGER,
      defaultValue: 60,
      comment: 'Break reminder interval in minutes'
    },
    breakReminderEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether break reminders are enabled'
    },
    dailyTargetHours: {
      type: DataTypes.INTEGER,
      defaultValue: 8,
      comment: 'Daily target hours for productivity tracking'
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users'
  }
);

export default User;
