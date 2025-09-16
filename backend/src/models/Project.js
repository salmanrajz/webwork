import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { PROJECT_STATUS } from '../utils/constants.js';

class Project extends Model {}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PROJECT_STATUS)),
      defaultValue: PROJECT_STATUS.PLANNED
    },
    startDate: {
      type: DataTypes.DATEONLY
    },
    endDate: {
      type: DataTypes.DATEONLY
    }
  },
  {
    sequelize,
    modelName: 'Project',
    tableName: 'projects'
  }
);

export default Project;
