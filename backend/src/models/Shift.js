import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { SHIFT_STATUS } from '../utils/constants.js';

class Shift extends Model {}

Shift.init(
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
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SHIFT_STATUS)),
      defaultValue: SHIFT_STATUS.SCHEDULED
    },
    notes: {
      type: DataTypes.TEXT
    }
  },
  {
    sequelize,
    modelName: 'Shift',
    tableName: 'shifts'
  }
);

export default Shift;
