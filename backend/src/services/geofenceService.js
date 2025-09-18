const { Geofence, GeoEvent, OrganizationSettings } = require('../models');
const { Op } = require('sequelize');

class GeofenceService {
  // Get active geofences for user
  async getActiveGeofences(userId) {
    try {
      // Get user's organization
      const user = await require('../models').User.findByPk(userId);
      if (!user) return [];

      const geofences = await Geofence.findAll({
        where: {
          organizationId: user.organizationId,
          isActive: true
        }
      });

      return geofences;
    } catch (error) {
      console.error('Error getting active geofences:', error);
      return [];
    }
  }

  // Check if point is inside geofence
  async isPointInGeofence(latitude, longitude, geofence) {
    try {
      if (geofence.type === 'circle') {
        return this.isPointInCircle(latitude, longitude, geofence);
      } else if (geofence.type === 'polygon') {
        return this.isPointInPolygon(latitude, longitude, geofence);
      }
      return false;
    } catch (error) {
      console.error('Error checking point in geofence:', error);
      return false;
    }
  }

  // Check if point is inside circle
  isPointInCircle(latitude, longitude, geofence) {
    const distance = this.calculateDistance(
      latitude, longitude,
      geofence.centerLatitude, geofence.centerLongitude
    );
    
    return distance <= geofence.radius;
  }

  // Check if point is inside polygon (using ray casting algorithm)
  isPointInPolygon(latitude, longitude, geofence) {
    try {
      if (!geofence.polygonData || !geofence.polygonData.coordinates) {
        return false;
      }

      const coordinates = geofence.polygonData.coordinates[0]; // First ring
      let inside = false;
      
      for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
        const xi = coordinates[i][0];
        const yi = coordinates[i][1];
        const xj = coordinates[j][0];
        const yj = coordinates[j][1];
        
        if (((yi > longitude) !== (yj > longitude)) &&
            (latitude < (xj - xi) * (longitude - yi) / (yj - yi) + xi)) {
          inside = !inside;
        }
      }
      
      return inside;
    } catch (error) {
      console.error('Error checking point in polygon:', error);
      return false;
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Check geofence events for multiple points
  async checkGeofenceEvents(points, userId, sessionId) {
    try {
      const geofences = await this.getActiveGeofences(userId);
      
      for (const point of points) {
        for (const geofence of geofences) {
          const isInside = await this.isPointInGeofence(
            point.latitude,
            point.longitude,
            geofence
          );

          await this.checkGeofenceEvent(userId, sessionId, geofence, point, isInside);
        }
      }
    } catch (error) {
      console.error('Error checking geofence events:', error);
    }
  }

  // Check for geofence enter/exit events
  async checkGeofenceEvent(userId, sessionId, geofence, point, isInside) {
    try {
      // Get the last event for this user/geofence combination
      const lastEvent = await GeoEvent.findOne({
        where: {
          userId,
          geofenceId: geofence.id
        },
        order: [['timestamp', 'DESC']]
      });

      let eventType = null;
      
      if (!lastEvent) {
        // First event - enter if inside
        if (isInside) {
          eventType = 'enter';
        }
      } else {
        // Check for state change
        if (lastEvent.eventType === 'exit' && isInside) {
          eventType = 'enter';
        } else if (lastEvent.eventType === 'enter' && !isInside) {
          eventType = 'exit';
        }
      }

      if (eventType) {
        await GeoEvent.create({
          userId,
          geofenceId: geofence.id,
          sessionId,
          timestamp: new Date(point.timestamp),
          eventType,
          latitude: point.latitude,
          longitude: point.longitude,
          accuracy: point.accuracy
        });

        // Handle auto clock-in/out if enabled
        if (eventType === 'enter' && geofence.autoClockIn) {
          await this.handleAutoClockIn(userId, geofence);
        } else if (eventType === 'exit' && geofence.autoClockOut) {
          await this.handleAutoClockOut(userId, geofence);
        }
      }
    } catch (error) {
      console.error('Error creating geofence event:', error);
    }
  }

  // Handle auto clock-in
  async handleAutoClockIn(userId, geofence) {
    try {
      const Session = require('../models').Session;
      
      // Check if user is already clocked in
      const activeSession = await Session.findOne({
        where: {
          userId,
          clockOut: null
        }
      });

      if (!activeSession) {
        // Create new session
        await Session.create({
          userId,
          clockIn: new Date(),
          taskId: geofence.worksiteId
        });
      }
    } catch (error) {
      console.error('Error handling auto clock-in:', error);
    }
  }

  // Handle auto clock-out
  async handleAutoClockOut(userId, geofence) {
    try {
      const Session = require('../models').Session;
      
      // Find active session
      const activeSession = await Session.findOne({
        where: {
          userId,
          clockOut: null
        }
      });

      if (activeSession) {
        await activeSession.update({
          clockOut: new Date()
        });
      }
    } catch (error) {
      console.error('Error handling auto clock-out:', error);
    }
  }

  // Get geofence statistics
  async getGeofenceStatistics(geofenceId, from, to) {
    try {
      const whereClause = { geofenceId };
      
      if (from && to) {
        whereClause.timestamp = {
          [Op.between]: [new Date(from), new Date(to)]
        };
      }

      const events = await GeoEvent.findAll({
        where: whereClause,
        order: [['timestamp', 'ASC']]
      });

      // Calculate statistics
      const enterEvents = events.filter(e => e.eventType === 'enter');
      const exitEvents = events.filter(e => e.eventType === 'exit');
      
      // Calculate dwell times
      const dwellTimes = [];
      for (let i = 0; i < enterEvents.length; i++) {
        const enterEvent = enterEvents[i];
        const exitEvent = exitEvents.find(e => 
          e.timestamp > enterEvent.timestamp && 
          e.userId === enterEvent.userId
        );
        
        if (exitEvent) {
          const dwellTime = (exitEvent.timestamp - enterEvent.timestamp) / 1000; // seconds
          dwellTimes.push(dwellTime);
        }
      }

      const totalDwellTime = dwellTimes.reduce((sum, time) => sum + time, 0);
      const averageDwellTime = dwellTimes.length > 0 ? totalDwellTime / dwellTimes.length : 0;

      return {
        totalEvents: events.length,
        enterEvents: enterEvents.length,
        exitEvents: exitEvents.length,
        uniqueUsers: [...new Set(events.map(e => e.userId))].length,
        totalDwellTime: Math.round(totalDwellTime),
        averageDwellTime: Math.round(averageDwellTime),
        dwellTimes: dwellTimes.map(time => Math.round(time))
      };
    } catch (error) {
      console.error('Error getting geofence statistics:', error);
      throw error;
    }
  }

  // Validate geofence data
  validateGeofenceData(data) {
    const errors = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!data.type || !['circle', 'polygon'].includes(data.type)) {
      errors.push('Type must be either "circle" or "polygon"');
    }

    if (data.type === 'circle') {
      if (!data.centerLatitude || !data.centerLongitude) {
        errors.push('Center coordinates are required for circular geofences');
      }
      if (!data.radius || data.radius <= 0) {
        errors.push('Radius must be greater than 0 for circular geofences');
      }
    }

    if (data.type === 'polygon') {
      if (!data.polygonData || !data.polygonData.coordinates) {
        errors.push('Polygon data is required for polygon geofences');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Create geofence with validation
  async createGeofence(data) {
    const validation = this.validateGeofenceData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return await Geofence.create(data);
  }

  // Update geofence with validation
  async updateGeofence(id, data) {
    const validation = this.validateGeofenceData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const geofence = await Geofence.findByPk(id);
    if (!geofence) {
      throw new Error('Geofence not found');
    }

    return await geofence.update(data);
  }
}

module.exports = new GeofenceService();
