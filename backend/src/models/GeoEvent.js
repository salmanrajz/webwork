import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class GeoEvent extends Model {}

GeoEvent.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    geofenceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'geofences',
        key: 'id'
      }
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'sessions',
        key: 'id'
      }
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false
    },
    eventType: {
      type: DataTypes.ENUM('enter', 'exit'),
      allowNull: false
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      comment: 'Location where event occurred'
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    accuracy: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'GPS accuracy when event occurred'
    },
    dwellTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time spent in geofence in seconds'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional event data'
    }
  }, {
    sequelize,
    tableName: 'geo_events',
    indexes: [
      {
        fields: ['userId', 'timestamp']
      },
      {
        fields: ['geofenceId']
      },
      {
        fields: ['sessionId']
      },
      {
        fields: ['eventType']
      },
      {
        fields: ['timestamp']
      }
    ],
    timestamps: true
  });

export default GeoEvent;
