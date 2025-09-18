'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create GPS points table
    await queryInterface.createTable('gps_points', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'sessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      accuracy: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Accuracy in meters'
      },
      speed: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Speed in m/s'
      },
      heading: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Heading in degrees (0-360)'
      },
      altitude: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Altitude in meters'
      },
      source: {
        type: Sequelize.ENUM('gps', 'network', 'passive'),
        allowNull: false,
        defaultValue: 'gps'
      },
      battery_level: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Battery percentage (0-100)'
      },
      is_moving: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      client_os: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'iOS, Android, Windows, macOS'
      },
      client_app: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'mobile, desktop, web'
      },
      raw_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional sensor data'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create geofences table
    await queryInterface.createTable('geofences', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('circle', 'polygon'),
        allowNull: false,
        defaultValue: 'circle'
      },
      center_latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
        comment: 'Center latitude for circular geofences'
      },
      center_longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
        comment: 'Center longitude for circular geofences'
      },
      radius: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Radius in meters for circular geofences'
      },
      polygon_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'GeoJSON polygon data for polygon geofences'
      },
      allowed_roles: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of role names allowed in this geofence'
      },
      worksite_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'worksites',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      active_hours: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Schedule when geofence is active {days: [1,2,3], start: "09:00", end: "17:00"}'
      },
      auto_clock_in: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Automatically clock in when entering geofence'
      },
      auto_clock_out: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Automatically clock out when exiting geofence'
      },
      block_outside_clock_in: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Block clock-in attempts outside geofence'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create geo_events table
    await queryInterface.createTable('geo_events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      geofence_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'geofences',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'sessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      event_type: {
        type: Sequelize.ENUM('enter', 'exit'),
        allowNull: false
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false,
        comment: 'Location where event occurred'
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      accuracy: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'GPS accuracy when event occurred'
      },
      dwell_time: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Time spent in geofence in seconds'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional event data'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create organization_settings table
    await queryInterface.createTable('organization_settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      gps_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Enable GPS tracking for this organization'
      },
      min_interval_seconds: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30,
        comment: 'Minimum interval between GPS points in seconds'
      },
      max_interval_seconds: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 300,
        comment: 'Maximum interval between GPS points in seconds'
      },
      retention_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 90,
        comment: 'Days to retain GPS data before automatic deletion'
      },
      block_outside_clock_in: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Block clock-in attempts outside allowed geofences'
      },
      require_geofence_clock_in: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Require users to be within a geofence to clock in'
      },
      auto_pause_on_exit: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Automatically pause timers when exiting geofences'
      },
      accuracy_threshold: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Minimum GPS accuracy threshold in meters (reject points below this)'
      },
      battery_optimization: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Enable battery optimization features'
      },
      background_tracking: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Allow background GPS tracking'
      },
      privacy_mode: {
        type: Sequelize.ENUM('full', 'reduced', 'disabled'),
        allowNull: false,
        defaultValue: 'full',
        comment: 'Privacy level for GPS tracking'
      },
      data_export_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Allow users to export their GPS data'
      },
      compliance_settings: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Compliance and legal settings'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes
    await queryInterface.addIndex('gps_points', ['user_id', 'timestamp']);
    await queryInterface.addIndex('gps_points', ['session_id']);
    await queryInterface.addIndex('gps_points', ['timestamp']);
    await queryInterface.addIndex('gps_points', ['latitude', 'longitude'], {
      name: 'gps_points_location_idx'
    });

    await queryInterface.addIndex('geofences', ['organization_id']);
    await queryInterface.addIndex('geofences', ['worksite_id']);
    await queryInterface.addIndex('geofences', ['is_active']);

    await queryInterface.addIndex('geo_events', ['user_id', 'timestamp']);
    await queryInterface.addIndex('geo_events', ['geofence_id']);
    await queryInterface.addIndex('geo_events', ['session_id']);
    await queryInterface.addIndex('geo_events', ['event_type']);
    await queryInterface.addIndex('geo_events', ['timestamp']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('geo_events');
    await queryInterface.dropTable('geofences');
    await queryInterface.dropTable('gps_points');
    await queryInterface.dropTable('organization_settings');
  }
};
