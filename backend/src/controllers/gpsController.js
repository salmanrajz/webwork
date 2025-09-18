// GPS controller with real data storage
// Global storage for GPS data (replace with database in production)
const gpsPoints = [];
const livePositions = new Map(); // userId -> latest position

class GpsController {

  // Get live positions (real data from stored points)
  async getLivePositions(req, res) {
    try {
      // Convert live positions map to array
      const liveData = Array.from(livePositions.values()).map(point => ({
        userId: point.userId,
        user: { name: point.userName || 'Unknown User', email: point.userEmail || 'unknown@example.com' },
        latitude: point.latitude,
        longitude: point.longitude,
        accuracy: point.accuracy,
        timestamp: point.timestamp,
        isMoving: point.isMoving || false
      }));

      res.json({
        success: true,
        data: liveData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch live positions',
        error: error.message
      });
    }
  }

  // Get route history (mock data)
  async getRouteHistory(req, res) {
    try {
      const { userId, date } = req.query;
      
      // Mock route data
      const mockData = {
        points: [],
        stats: {
          totalDistance: 0,
          totalDuration: 0,
          averageSpeed: 0,
          pointCount: 0
        }
      };

      res.json({
        success: true,
        data: mockData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch route history',
        error: error.message
      });
    }
  }

  // Batch ingest GPS points (real implementation)
  async batchIngestPoints(req, res) {
    try {
      const { points } = req.body;
      const userId = req.user.id; // From auth middleware
      
      console.log('📍 GPS points received:', points?.length || 0, 'for user:', userId);
      console.log('📍 GPS storage arrays:', { gpsPoints: gpsPoints?.length, livePositions: livePositions?.size });
      
      if (points && points.length > 0) {
        // Store GPS points
        points.forEach(point => {
          const gpsPoint = {
            ...point,
            userId: userId,
            userName: req.user.firstName + ' ' + req.user.lastName,
            userEmail: req.user.email,
            timestamp: point.timestamp || new Date().toISOString()
          };
          
          console.log('📍 Storing GPS point:', gpsPoint.latitude, gpsPoint.longitude);
          gpsPoints.push(gpsPoint);
          
          // Update live position
          livePositions.set(userId, gpsPoint);
        });
        
        console.log('✅ GPS points stored. Total points:', gpsPoints.length);
        console.log('✅ Live positions updated. Total users:', livePositions.size);
      }
      
      res.json({
        success: true,
        message: 'GPS points received and stored',
        count: points?.length || 0
      });
    } catch (error) {
      console.error('❌ Failed to ingest GPS points:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to ingest GPS points',
        error: error.message
      });
    }
  }

  // Get GPS events (mock data)
  async getGpsEvents(req, res) {
    try {
      const mockData = [];

      res.json({
        success: true,
        data: mockData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch GPS events',
        error: error.message
      });
    }
  }

  // Export GPS data (mock implementation)
  async exportGpsData(req, res) {
    try {
      res.json({
        success: true,
        message: 'GPS export not implemented yet',
        data: []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to export GPS data',
        error: error.message
      });
    }
  }
}

const gpsController = new GpsController();
export default gpsController;