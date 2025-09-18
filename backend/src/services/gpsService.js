const { GpsPoint, GeoEvent, User, Session } = require('../models');
const { Op } = require('sequelize');
const geofenceService = require('./geofenceService');

class GpsService {
  // Process and store GPS points
  async processGpsPoints(points, userId, sessionId) {
    const processed = [];
    const rejected = [];
    const errors = [];

    for (const point of points) {
      try {
        // Validate point data
        if (!this.validateGpsPoint(point)) {
          rejected.push({ point, reason: 'Invalid point data' });
          continue;
        }

        // Create GPS point record
        const gpsPoint = await GpsPoint.create({
          sessionId,
          userId,
          timestamp: new Date(point.timestamp),
          latitude: parseFloat(point.latitude),
          longitude: parseFloat(point.longitude),
          accuracy: point.accuracy ? parseFloat(point.accuracy) : null,
          speed: point.speed ? parseFloat(point.speed) : null,
          heading: point.heading ? parseFloat(point.heading) : null,
          altitude: point.altitude ? parseFloat(point.altitude) : null,
          source: point.source || 'gps',
          batteryLevel: point.batteryLevel || null,
          isMoving: point.isMoving || false,
          clientOs: point.clientOs || null,
          clientApp: point.clientApp || 'mobile',
          rawData: point.rawData || null
        });

        processed.push(gpsPoint);

        // Check for geofence events
        await this.checkGeofenceEventsForPoint(gpsPoint);

      } catch (error) {
        errors.push({ point, error: error.message });
      }
    }

    return { processed, rejected, errors };
  }

  // Validate GPS point data
  validateGpsPoint(point) {
    const required = ['latitude', 'longitude', 'timestamp'];
    
    for (const field of required) {
      if (point[field] === undefined || point[field] === null) {
        return false;
      }
    }

    // Validate latitude (-90 to 90)
    if (point.latitude < -90 || point.latitude > 90) {
      return false;
    }

    // Validate longitude (-180 to 180)
    if (point.longitude < -180 || point.longitude > 180) {
      return false;
    }

    // Validate timestamp
    const timestamp = new Date(point.timestamp);
    if (isNaN(timestamp.getTime())) {
      return false;
    }

    return true;
  }

  // Check geofence events for a single point
  async checkGeofenceEventsForPoint(gpsPoint) {
    try {
      const geofences = await geofenceService.getActiveGeofences(gpsPoint.userId);
      
      for (const geofence of geofences) {
        const isInside = await geofenceService.isPointInGeofence(
          gpsPoint.latitude,
          gpsPoint.longitude,
          geofence
        );

        // Check for enter/exit events
        await this.checkGeofenceEvent(gpsPoint, geofence, isInside);
      }
    } catch (error) {
      console.error('Error checking geofence events:', error);
    }
  }

  // Check for geofence enter/exit events
  async checkGeofenceEvent(gpsPoint, geofence, isInside) {
    try {
      // Get the last event for this user/geofence combination
      const lastEvent = await GeoEvent.findOne({
        where: {
          userId: gpsPoint.userId,
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
          userId: gpsPoint.userId,
          geofenceId: geofence.id,
          sessionId: gpsPoint.sessionId,
          timestamp: gpsPoint.timestamp,
          eventType,
          latitude: gpsPoint.latitude,
          longitude: gpsPoint.longitude,
          accuracy: gpsPoint.accuracy
        });

        // Handle auto clock-in/out if enabled
        if (eventType === 'enter' && geofence.autoClockIn) {
          await this.handleAutoClockIn(gpsPoint.userId, geofence);
        } else if (eventType === 'exit' && geofence.autoClockOut) {
          await this.handleAutoClockOut(gpsPoint.userId, geofence);
        }
      }
    } catch (error) {
      console.error('Error creating geofence event:', error);
    }
  }

  // Handle auto clock-in
  async handleAutoClockIn(userId, geofence) {
    try {
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
          taskId: null // Could be linked to geofence's worksite
        });
      }
    } catch (error) {
      console.error('Error handling auto clock-in:', error);
    }
  }

  // Handle auto clock-out
  async handleAutoClockOut(userId, geofence) {
    try {
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

  // Get live positions for team
  async getLivePositions(team, organizationId) {
    try {
      const whereClause = {
        timestamp: {
          [Op.gte]: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      };

      if (team) {
        whereClause.userId = { [Op.in]: team.split(',') };
      }

      const latestPoints = await GpsPoint.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['timestamp', 'DESC']]
      });

      // Group by user to get latest position per user
      const userPositions = {};
      latestPoints.forEach(point => {
        if (!userPositions[point.userId] || 
            point.timestamp > userPositions[point.userId].timestamp) {
          userPositions[point.userId] = point;
        }
      });

      return Object.values(userPositions).map(point => ({
        userId: point.userId,
        user: point.user,
        latitude: point.latitude,
        longitude: point.longitude,
        accuracy: point.accuracy,
        timestamp: point.timestamp,
        age: Math.floor((Date.now() - point.timestamp.getTime()) / 1000),
        isMoving: point.isMoving,
        batteryLevel: point.batteryLevel
      }));
    } catch (error) {
      console.error('Error getting live positions:', error);
      throw error;
    }
  }

  // Get route history
  async getRouteHistory(userId, date, taskId) {
    try {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const whereClause = {
        userId,
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      };

      if (taskId) {
        whereClause.sessionId = taskId;
      }

      const points = await GpsPoint.findAll({
        where: whereClause,
        order: [['timestamp', 'ASC']]
      });

      // Calculate route statistics
      const stats = this.calculateRouteStats(points);

      return {
        points: points.map(point => ({
          id: point.id,
          latitude: point.latitude,
          longitude: point.longitude,
          timestamp: point.timestamp,
          accuracy: point.accuracy,
          speed: point.speed,
          heading: point.heading,
          isMoving: point.isMoving
        })),
        stats
      };
    } catch (error) {
      console.error('Error getting route history:', error);
      throw error;
    }
  }

  // Calculate route statistics
  calculateRouteStats(points) {
    if (points.length === 0) {
      return {
        totalDistance: 0,
        totalDuration: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        pointCount: 0
      };
    }

    let totalDistance = 0;
    let totalDuration = 0;
    let maxSpeed = 0;
    let movingTime = 0;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      const distance = this.calculateDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
      
      const duration = (curr.timestamp - prev.timestamp) / 1000; // seconds
      
      totalDistance += distance;
      totalDuration += duration;
      
      if (curr.speed && curr.speed > maxSpeed) {
        maxSpeed = curr.speed;
      }
      
      if (curr.isMoving) {
        movingTime += duration;
      }
    }

    return {
      totalDistance: Math.round(totalDistance * 100) / 100, // meters
      totalDuration: Math.round(totalDuration), // seconds
      averageSpeed: totalDuration > 0 ? Math.round((totalDistance / totalDuration) * 3.6 * 100) / 100 : 0, // km/h
      maxSpeed: Math.round(maxSpeed * 3.6 * 100) / 100, // km/h
      movingTime: Math.round(movingTime), // seconds
      pointCount: points.length
    };
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

  // Get geofence events
  async getGeofenceEvents(userId, from, to, geofenceId) {
    try {
      const whereClause = { userId };
      
      if (from && to) {
        whereClause.timestamp = {
          [Op.between]: [new Date(from), new Date(to)]
        };
      }
      
      if (geofenceId) {
        whereClause.geofenceId = geofenceId;
      }

      const events = await GeoEvent.findAll({
        where: whereClause,
        include: [
          {
            model: require('../models').Geofence,
            as: 'geofence',
            attributes: ['id', 'name', 'type']
          }
        ],
        order: [['timestamp', 'DESC']]
      });

      return events;
    } catch (error) {
      console.error('Error getting geofence events:', error);
      throw error;
    }
  }

  // Export GPS data
  async exportGpsData(userId, from, to, format) {
    try {
      const startDate = new Date(from);
      const endDate = new Date(to);

      const points = await GpsPoint.findAll({
        where: {
          userId,
          timestamp: {
            [Op.between]: [startDate, endDate]
          }
        },
        order: [['timestamp', 'ASC']]
      });

      if (format === 'csv') {
        return this.generateCsvExport(points);
      } else if (format === 'gpx') {
        return this.generateGpxExport(points);
      } else {
        return points;
      }
    } catch (error) {
      console.error('Error exporting GPS data:', error);
      throw error;
    }
  }

  // Generate CSV export
  generateCsvExport(points) {
    const headers = [
      'timestamp', 'latitude', 'longitude', 'accuracy', 'speed', 
      'heading', 'altitude', 'source', 'batteryLevel', 'isMoving'
    ];
    
    const csv = [headers.join(',')];
    
    points.forEach(point => {
      const row = headers.map(header => {
        const value = point[header];
        return value !== null && value !== undefined ? value : '';
      });
      csv.push(row.join(','));
    });
    
    return csv.join('\n');
  }

  // Generate GPX export
  generateGpxExport(points) {
    const gpx = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<gpx version="1.1" creator="WebWork Tracker">',
      '<trk>',
      '<name>GPS Track</name>',
      '<trkseg>'
    ];

    points.forEach(point => {
      gpx.push(`<trkpt lat="${point.latitude}" lon="${point.longitude}">`);
      gpx.push(`<time>${point.timestamp.toISOString()}</time>`);
      if (point.altitude) {
        gpx.push(`<ele>${point.altitude}</ele>`);
      }
      gpx.push('</trkpt>');
    });

    gpx.push('</trkseg>');
    gpx.push('</trk>');
    gpx.push('</gpx>');

    return gpx.join('\n');
  }
}

module.exports = new GpsService();
