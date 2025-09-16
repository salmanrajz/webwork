import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Activity extends Model {}

Activity.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    capturedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15
    },
    windowTitle: {
      type: DataTypes.STRING
    },
    appName: {
      type: DataTypes.STRING
    },
    url: {
      type: DataTypes.STRING
    },
    idleSeconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    activityScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 1.0
    },
    cpuUsage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    keyboardCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    mouseCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    keystrokes: {
      type: DataTypes.JSONB,
      defaultValue: []
    }
  },
  {
    sequelize,
    modelName: 'Activity',
    tableName: 'activities'
  }
);

export default Activity;
