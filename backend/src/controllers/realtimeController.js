import { getRealtimeSnapshot } from '../services/realtimeService.js';

export const getRealtimeOverview = async (_req, res) => {
  const snapshot = await getRealtimeSnapshot();
  res.json({ success: true, data: snapshot });
};

export const handleRealtimeActivity = async (req, res) => {
  try {
    const { userId, data, timestamp } = req.body;
    
    // Broadcast to WebSocket clients if available
    if (global.wsManager) {
      global.wsManager.broadcastToUser(userId, {
        type: 'activity_update',
        data: data,
        timestamp: timestamp || new Date().toISOString()
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Real-time activity data received',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error handling real-time activity:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process real-time activity' 
    });
  }
};
