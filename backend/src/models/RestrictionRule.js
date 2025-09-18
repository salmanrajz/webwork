import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RestrictionRule = sequelize.define('RestrictionRule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Rule name for identification'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Rule description'
  },
  type: {
    type: DataTypes.ENUM('block', 'alert', 'time_limit'),
    allowNull: false,
    defaultValue: 'block',
    comment: 'Type of restriction: block, alert, or time_limit'
  },
  targetType: {
    type: DataTypes.ENUM('domain', 'url', 'category'),
    allowNull: false,
    comment: 'What to target: domain, specific URL, or category'
  },
  targetValue: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'The actual domain, URL, or category name'
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium',
    comment: 'Severity level of the restriction'
  },
  timeRestrictions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Time-based restrictions (e.g., only during work hours)',
    defaultValue: null
  },
  timeLimit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Time limit in minutes (for time_limit type)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether the rule is active'
  },
  appliesTo: {
    type: DataTypes.ENUM('all', 'user', 'team', 'role'),
    allowNull: false,
    defaultValue: 'all',
    comment: 'Who this rule applies to'
  },
  targetUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Specific user ID if appliesTo is user'
  },
  targetTeamId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Specific team ID if appliesTo is team'
  },
  targetRole: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Specific role if appliesTo is role'
  },
  alertMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Custom alert message for violations'
  },
  overrideRequired: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether override permission is required'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'User who created this rule'
  }
}, {
  tableName: 'restriction_rules',
  timestamps: true,
  indexes: [
    {
      fields: ['is_active', 'applies_to']
    },
    {
      fields: ['target_type', 'target_value']
    },
    {
      fields: ['created_by']
    }
  ]
});

export default RestrictionRule;
