import { RestrictionRule, RestrictionViolation, User, Team } from '../models/index.js';
import { Op } from 'sequelize';

// Get all restriction rules
const getRestrictionRules = async (req, res) => {
  try {
    const { id: userId, teamId, role } = req.user;
    const { type, isActive, appliesTo } = req.query;

    let whereClause = {};

    // Filter by type if provided
    if (type) {
      whereClause.type = type;
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Filter by applies to if provided
    if (appliesTo) {
      whereClause.appliesTo = appliesTo;
    }

    // Build the OR conditions dynamically to avoid undefined values
    const orConditions = [{ appliesTo: 'all' }];
    
    if (userId) {
      orConditions.push({ appliesTo: 'user', targetUserId: userId });
    }
    
    if (teamId) {
      orConditions.push({ appliesTo: 'team', targetTeamId: teamId });
    }
    
    if (role) {
      orConditions.push({ appliesTo: 'role', targetRole: role });
    }

    // Get rules that apply to this user
    const rules = await RestrictionRule.findAll({
      where: {
        [Op.or]: orConditions,
        ...whereClause
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching restriction rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restriction rules',
      error: error.message
    });
  }
};

// Create a new restriction rule
const createRestrictionRule = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const ruleData = {
      ...req.body,
      createdBy: userId
    };

    const rule = await RestrictionRule.create(ruleData);

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Restriction rule created successfully'
    });
  } catch (error) {
    console.error('Error creating restriction rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create restriction rule',
      error: error.message
    });
  }
};

// Update a restriction rule
const updateRestrictionRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const rule = await RestrictionRule.findByPk(id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Restriction rule not found'
      });
    }

    // Check if user has permission to update this rule
    if (rule.createdBy !== userId && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this rule'
      });
    }

    await rule.update(req.body);

    res.json({
      success: true,
      data: rule,
      message: 'Restriction rule updated successfully'
    });
  } catch (error) {
    console.error('Error updating restriction rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update restriction rule',
      error: error.message
    });
  }
};

// Delete a restriction rule
const deleteRestrictionRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const rule = await RestrictionRule.findByPk(id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Restriction rule not found'
      });
    }

    // Check if user has permission to delete this rule
    if (rule.createdBy !== userId && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this rule'
      });
    }

    await rule.destroy();

    res.json({
      success: true,
      message: 'Restriction rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting restriction rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete restriction rule',
      error: error.message
    });
  }
};

// Check if a URL is restricted
const checkUrlRestriction = async (req, res) => {
  try {
    const { id: userId, teamId, role } = req.user;
    const { url, domain } = req.body;

    if (!url && !domain) {
      return res.status(400).json({
        success: false,
        message: 'URL or domain is required'
      });
    }

    const targetValue = domain || new URL(url).hostname;

    // Build the OR conditions dynamically to avoid undefined values
    const appliesToConditions = [{ appliesTo: 'all' }];
    
    if (userId) {
      appliesToConditions.push({ appliesTo: 'user', targetUserId: userId });
    }
    
    if (teamId) {
      appliesToConditions.push({ appliesTo: 'team', targetTeamId: teamId });
    }
    
    if (role) {
      appliesToConditions.push({ appliesTo: 'role', targetRole: role });
    }

    // Build target type conditions
    const targetConditions = [];
    if (targetValue) {
      targetConditions.push({ targetType: 'domain', targetValue: { [Op.like]: `%${targetValue}%` } });
    }
    if (url) {
      targetConditions.push({ targetType: 'url', targetValue: { [Op.like]: `%${url}%` } });
    }

    // Get applicable rules
    const rules = await RestrictionRule.findAll({
      where: {
        isActive: true,
        [Op.and]: [
          { [Op.or]: appliesToConditions },
          { [Op.or]: targetConditions }
        ]
      },
      order: [['severity', 'DESC']]
    });

    if (rules.length === 0) {
      return res.json({
        success: true,
        data: {
          isRestricted: false,
          rules: []
        }
      });
    }

    // Check time restrictions
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const applicableRules = rules.filter(rule => {
      if (!rule.timeRestrictions) return true;

      const timeRestrictions = rule.timeRestrictions;
      
      // Check day restrictions
      if (timeRestrictions.days && !timeRestrictions.days.includes(currentDay)) {
        return false;
      }

      // Check time restrictions
      if (timeRestrictions.startHour && timeRestrictions.endHour) {
        if (currentHour < timeRestrictions.startHour || currentHour >= timeRestrictions.endHour) {
          return false;
        }
      }

      return true;
    });

    const isRestricted = applicableRules.length > 0;
    const highestSeverity = applicableRules.length > 0 ? 
      applicableRules[0].severity : null;

    res.json({
      success: true,
      data: {
        isRestricted,
        rules: applicableRules,
        severity: highestSeverity,
        message: isRestricted ? 
          `Access to ${targetValue} is restricted` : 
          `Access to ${targetValue} is allowed`
      }
    });
  } catch (error) {
    console.error('Error checking URL restriction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check URL restriction',
      error: error.message
    });
  }
};

// Record a restriction violation
const recordViolation = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { ruleId, targetUrl, targetDomain, violationType, duration, metadata } = req.body;

    const rule = await RestrictionRule.findByPk(ruleId);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Restriction rule not found'
      });
    }

    const violation = await RestrictionViolation.create({
      userId,
      ruleId,
      violationType,
      targetUrl,
      targetDomain,
      duration,
      severity: rule.severity,
      metadata
    });

    res.status(201).json({
      success: true,
      data: violation,
      message: 'Violation recorded successfully'
    });
  } catch (error) {
    console.error('Error recording violation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record violation',
      error: error.message
    });
  }
};

// Get violation history
const getViolations = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { status, severity, startDate, endDate, limit = 50, offset = 0 } = req.query;

    let whereClause = {};

    // Regular users can only see their own violations
    if (role !== 'admin') {
      whereClause.userId = userId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (severity) {
      whereClause.severity = severity;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    const violations = await RestrictionViolation.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: RestrictionRule,
          as: 'rule',
          attributes: ['id', 'name', 'type', 'targetValue']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: violations.rows,
      total: violations.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch violations',
      error: error.message
    });
  }
};

// Acknowledge a violation
const acknowledgeViolation = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const violation = await RestrictionViolation.findByPk(id);
    if (!violation) {
      return res.status(404).json({
        success: false,
        message: 'Violation not found'
      });
    }

    await violation.update({
      status: 'acknowledged',
      acknowledgedBy: userId,
      acknowledgedAt: new Date()
    });

    res.json({
      success: true,
      data: violation,
      message: 'Violation acknowledged successfully'
    });
  } catch (error) {
    console.error('Error acknowledging violation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge violation',
      error: error.message
    });
  }
};

export {
  getRestrictionRules,
  createRestrictionRule,
  updateRestrictionRule,
  deleteRestrictionRule,
  checkUrlRestriction,
  recordViolation,
  getViolations,
  acknowledgeViolation
};
