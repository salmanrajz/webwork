import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { TASK_STATUS } from '../utils/constants.js';

class Task extends Model {}

Task.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TASK_STATUS)),
      defaultValue: TASK_STATUS.TODO
    },
    estimatedHours: {
      type: DataTypes.DECIMAL(5, 2)
    },
    dueDate: {
      type: DataTypes.DATEONLY
    }
  },
  {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks'
  }
);

export default Task;
