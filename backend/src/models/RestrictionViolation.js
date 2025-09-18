import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RestrictionViolation = sequelize.define('RestrictionViolation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'User who violated the restriction'
  },
  ruleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Restriction rule that was violated'
  },
  violationType: {
    type: DataTypes.ENUM('blocked_access', 'time_limit_exceeded', 'alert_triggered'),
    allowNull: false,
    comment: 'Type of violation'
  },
  targetUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'URL that was accessed'
  },
  targetDomain: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Domain that was accessed'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in seconds spent on restricted site'
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    comment: 'Severity of the violation'
  },
  status: {
    type: DataTypes.ENUM('active', 'acknowledged', 'resolved', 'overridden'),
    allowNull: false,
    defaultValue: 'active',
    comment: 'Status of the violation'
  },
  acknowledgedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'User who acknowledged the violation'
  },
  acknowledgedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the violation was acknowledged'
  },
  overrideReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for override if status is overridden'
  },
  overrideBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'User who granted the override'
  },
  overrideAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the override was granted'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata about the violation'
  }
}, {
  tableName: 'restriction_violations',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id', 'status']
    },
    {
      fields: ['rule_id']
    },
    {
      fields: ['violation_type']
    },
    {
      fields: ['created_at']
    }
  ]
});

export default RestrictionViolation;
