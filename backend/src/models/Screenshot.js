import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Screenshot extends Model {}

Screenshot.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    imagePath: {
      type: DataTypes.STRING,
      allowNull: false
    },
    capturedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    note: {
      type: DataTypes.TEXT
    }
  },
  {
    sequelize,
    modelName: 'Screenshot',
    tableName: 'screenshots'
  }
);

export default Screenshot;
