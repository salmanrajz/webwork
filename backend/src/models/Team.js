import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Team extends Model {}

Team.init(
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
    managerId: {
      type: DataTypes.UUID
    }
  },
  {
    sequelize,
    modelName: 'Team',
    tableName: 'teams'
  }
);

export default Team;
