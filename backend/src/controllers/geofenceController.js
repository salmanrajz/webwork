// Simple Geofence controller with mock data for testing
class GeofenceController {
  // Get all geofences (mock data)
  async getGeofences(req, res) {
    try {
      const mockData = [
        {
          id: '1',
          name: 'Office Building',
          description: 'Main office location',
          type: 'circle',
          autoClockIn: true,
          autoClockOut: false,
          blockOutsideClockIn: false
        },
        {
          id: '2',
          name: 'Client Site A',
          description: 'Client location for project work',
          type: 'polygon',
          autoClockIn: false,
          autoClockOut: true,
          blockOutsideClockIn: true
        }
      ];

      res.json({
        success: true,
        data: mockData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch geofences',
        error: error.message
      });
    }
  }

  // Create geofence (mock implementation)
  async createGeofence(req, res) {
    try {
      const geofenceData = req.body;
      
      console.log('📍 Creating geofence:', geofenceData.name);
      
      res.json({
        success: true,
        message: 'Geofence created successfully',
        data: { id: Date.now().toString(), ...geofenceData }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create geofence',
        error: error.message
      });
    }
  }

  // Get geofence by ID (mock implementation)
  async getGeofenceById(req, res) {
    try {
      const { id } = req.params;
      
      res.json({
        success: true,
        data: {
          id,
          name: 'Mock Geofence',
          type: 'circle'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch geofence',
        error: error.message
      });
    }
  }

  // Update geofence (mock implementation)
  async updateGeofence(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      console.log('📍 Updating geofence:', id);
      
      res.json({
        success: true,
        message: 'Geofence updated successfully',
        data: { id, ...updateData }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update geofence',
        error: error.message
      });
    }
  }

  // Delete geofence (mock implementation)
  async deleteGeofence(req, res) {
    try {
      const { id } = req.params;
      
      console.log('📍 Deleting geofence:', id);
      
      res.json({
        success: true,
        message: 'Geofence deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete geofence',
        error: error.message
      });
    }
  }

  // Test geofence (mock implementation)
  async testGeofence(req, res) {
    try {
      const { id } = req.params;
      const { latitude, longitude } = req.body;
      
      console.log('📍 Testing geofence:', id, 'at', latitude, longitude);
      
      res.json({
        success: true,
        data: {
          inside: Math.random() > 0.5,
          distance: Math.random() * 100
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to test geofence',
        error: error.message
      });
    }
  }

  // Get geofence stats (mock implementation)
  async getGeofenceStats(req, res) {
    try {
      const { id } = req.params;
      
      res.json({
        success: true,
        data: {
          totalEvents: 0,
          enterEvents: 0,
          exitEvents: 0,
          lastEvent: null
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch geofence stats',
        error: error.message
      });
    }
  }
}

export default new GeofenceController();