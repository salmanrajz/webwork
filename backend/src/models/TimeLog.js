import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class TimeLog extends Model {}

TimeLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: DataTypes.DATE
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    note: {
      type: DataTypes.TEXT
    },
    isManual: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'TimeLog',
    tableName: 'time_logs',
    hooks: {
      beforeSave: (timeLog) => {
        if (timeLog.endTime && timeLog.startTime) {
          const diff = (new Date(timeLog.endTime).getTime() - new Date(timeLog.startTime).getTime()) / 60000;
          if (Number.isFinite(diff) && diff >= 0) {
            timeLog.durationMinutes = Math.round(diff);
          }
        }
      }
    }
  }
);

export default TimeLog;
