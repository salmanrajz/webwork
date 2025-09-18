import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Geofence extends Model {}

Geofence.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('circle', 'polygon'),
      allowNull: false,
      defaultValue: 'circle'
    },
    centerLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      comment: 'Center latitude for circular geofences'
    },
    centerLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      comment: 'Center longitude for circular geofences'
    },
    radius: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Radius in meters for circular geofences'
    },
    polygonData: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'GeoJSON polygon data for polygon geofences'
    },
    allowedRoles: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of role names allowed in this geofence'
    },
    worksiteId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'worksites',
        key: 'id'
      }
    },
    activeHours: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Schedule when geofence is active {days: [1,2,3], start: "09:00", end: "17:00"}'
    },
    autoClockIn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Automatically clock in when entering geofence'
    },
    autoClockOut: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Automatically clock out when exiting geofence'
    },
    blockOutsideClockIn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Block clock-in attempts outside geofence'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'geofences',
    indexes: [
      {
        fields: ['organizationId']
      },
      {
        fields: ['worksiteId']
      },
      {
        fields: ['isActive']
      }
    ],
    timestamps: true
  });

export default Geofence;
