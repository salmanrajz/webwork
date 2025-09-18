import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
// No need to import authMiddleware since we're handling JWT verification directly

class WebSocketManager {
  constructor(server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/realtime'
    });
    
    this.clients = new Map(); // userId -> Set of WebSocket connections
    
    this.wss.on('connection', this.handleConnection.bind(this));
  }
  
  handleConnection(ws, req) {
    console.log('🔗 New WebSocket connection attempt');
    
    // Extract token from query params
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      console.log('❌ No token provided');
      ws.close(1008, 'No authentication token provided');
      return;
    }
    
    try {
      console.log('🔍 WebSocket token verification attempt:', token ? 'Token present' : 'No token');
      console.log('🔍 JWT_SECRET available:', process.env.JWT_SECRET ? 'Yes' : 'No');
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      
      console.log(`✅ WebSocket authenticated for user: ${userId}`);
      
      // Store connection
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId).add(ws);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Real-time monitoring connected',
        timestamp: new Date().toISOString()
      }));
      
      // Handle client messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(userId, message, ws);
        } catch (error) {
          console.warn('⚠️ Invalid WebSocket message:', error.message);
        }
      });
      
      // Handle disconnection
      ws.on('close', () => {
        console.log(`🔌 WebSocket disconnected for user: ${userId}`);
        const userClients = this.clients.get(userId);
        if (userClients) {
          userClients.delete(ws);
          if (userClients.size === 0) {
            this.clients.delete(userId);
          }
        }
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.warn(`⚠️ WebSocket error for user ${userId}:`, error.message);
      });
      
    } catch (error) {
      console.log('❌ Invalid token:', error.message);
      console.log('❌ Token verification error details:', error);
      ws.close(1008, 'Invalid authentication token');
    }
  }
  
  handleMessage(userId, message, ws) {
    console.log(`📨 Message from user ${userId}:`, message.type);
    
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        break;
        
      case 'activity_update':
        // Broadcast to other clients of the same user (if any)
        this.broadcastToUser(userId, {
          type: 'activity_update',
          data: message.data,
          timestamp: new Date().toISOString()
        }, ws);
        break;
        
      default:
        console.log(`❓ Unknown message type: ${message.type}`);
    }
  }
  
  // Broadcast to all clients of a specific user
  broadcastToUser(userId, message, excludeWs = null) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const messageStr = JSON.stringify(message);
      userClients.forEach(ws => {
        if (ws !== excludeWs && ws.readyState === 1) { // WebSocket.OPEN
          try {
            ws.send(messageStr);
          } catch (error) {
            console.warn('⚠️ Failed to send to client:', error.message);
          }
        }
      });
    }
  }
  
  // Broadcast to all connected clients
  broadcast(message) {
    console.log('📢 Broadcasting message to all connected users:', message.type);
    console.log('📊 Total connected users:', this.clients.size);
    
    const messageStr = JSON.stringify(message);
    let sentCount = 0;
    
    this.clients.forEach((userClients, userId) => {
      console.log(`📤 Sending to user ${userId} (${userClients.size} connections)`);
      userClients.forEach(ws => {
        if (ws.readyState === 1) { // WebSocket.OPEN
          try {
            ws.send(messageStr);
            sentCount++;
          } catch (error) {
            console.warn(`⚠️ Failed to broadcast to user ${userId}:`, error.message);
          }
        }
      });
    });
    
    console.log(`✅ Broadcast sent to ${sentCount} connections`);
  }
  
  // Get connection stats
  getStats() {
    const stats = {
      totalConnections: 0,
      uniqueUsers: this.clients.size,
      users: []
    };
    
    this.clients.forEach((userClients, userId) => {
      stats.totalConnections += userClients.size;
      stats.users.push({
        userId,
        connections: userClients.size
      });
    });
    
    return stats;
  }
}

export default WebSocketManager;
