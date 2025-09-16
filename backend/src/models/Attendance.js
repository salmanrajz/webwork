import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { ATTENDANCE_STATUS } from '../utils/constants.js';

class Attendance extends Model {}

Attendance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    clockIn: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    clockOut: {
      type: DataTypes.DATE
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ATTENDANCE_STATUS)),
      defaultValue: ATTENDANCE_STATUS.PRESENT
    },
    notes: {
      type: DataTypes.TEXT
    }
  },
  {
    sequelize,
    modelName: 'Attendance',
    tableName: 'attendance',
    hooks: {
      beforeSave: (attendance) => {
        if (attendance.clockIn && attendance.clockOut) {
          const diff =
            (new Date(attendance.clockOut).getTime() - new Date(attendance.clockIn).getTime()) /
            (1000 * 60);
          if (Number.isFinite(diff) && diff >= 0) {
            attendance.durationMinutes = Math.round(diff);
          }
        }
      }
    }
  }
);

export default Attendance;
