const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GpsPoint = sequelize.define('GpsPoint', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sessions',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    accuracy: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Accuracy in meters'
    },
    speed: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Speed in m/s'
    },
    heading: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Heading in degrees (0-360)'
    },
    altitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Altitude in meters'
    },
    source: {
      type: DataTypes.ENUM('gps', 'network', 'passive'),
      allowNull: false,
      defaultValue: 'gps'
    },
    batteryLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Battery percentage (0-100)'
    },
    isMoving: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    clientOs: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'iOS, Android, Windows, macOS'
    },
    clientApp: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'mobile, desktop, web'
    },
    rawData: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional sensor data'
    }
  }, {
    tableName: 'gps_points',
    indexes: [
      {
        fields: ['userId', 'timestamp']
      },
      {
        fields: ['sessionId']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['latitude', 'longitude'],
        name: 'gps_points_location_idx'
      }
    ],
    timestamps: true
  });

  GpsPoint.associate = (models) => {
    GpsPoint.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    GpsPoint.belongsTo(models.Session, {
      foreignKey: 'sessionId',
      as: 'session'
    });
  };

  return GpsPoint;
};
