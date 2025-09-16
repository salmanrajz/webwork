import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class TeamMember extends Model {}

TeamMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'member'
    }
  },
  {
    sequelize,
    modelName: 'TeamMember',
    tableName: 'team_members'
  }
);

export default TeamMember;
