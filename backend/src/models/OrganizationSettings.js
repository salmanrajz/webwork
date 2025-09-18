const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrganizationSettings = sequelize.define('OrganizationSettings', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    gpsEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Enable GPS tracking for this organization'
    },
    minIntervalSeconds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      comment: 'Minimum interval between GPS points in seconds'
    },
    maxIntervalSeconds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 300,
      comment: 'Maximum interval between GPS points in seconds'
    },
    retentionDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 90,
      comment: 'Days to retain GPS data before automatic deletion'
    },
    blockOutsideClockIn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Block clock-in attempts outside allowed geofences'
    },
    requireGeofenceClockIn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Require users to be within a geofence to clock in'
    },
    autoPauseOnExit: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Automatically pause timers when exiting geofences'
    },
    accuracyThreshold: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Minimum GPS accuracy threshold in meters (reject points below this)'
    },
    batteryOptimization: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Enable battery optimization features'
    },
    backgroundTracking: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Allow background GPS tracking'
    },
    privacyMode: {
      type: DataTypes.ENUM('full', 'reduced', 'disabled'),
      allowNull: false,
      defaultValue: 'full',
      comment: 'Privacy level for GPS tracking'
    },
    dataExportEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Allow users to export their GPS data'
    },
    complianceSettings: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Compliance and legal settings'
    }
  }, {
    tableName: 'organization_settings',
    timestamps: true
  });

  OrganizationSettings.associate = (models) => {
    OrganizationSettings.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });
  };

  return OrganizationSettings;
};
