#!/usr/bin/env node

/**
 * Test script to demonstrate sending push notifications
 * Usage: node test-notifications.js
 */

import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';
const TEST_TOKEN = 'your-jwt-token-here'; // Replace with actual JWT token

// Test notification examples
const testNotifications = {
  // Send to specific user
  sendToUser: async (userId, token) => {
    try {
      const response = await axios.post(`${API_BASE}/notifications/user/${userId}`, {
        title: 'Test Notification',
        message: 'This is a test notification sent to a specific user',
        notificationType: 'info',
        priority: 'normal',
        actions: [
          { label: 'View Details', action: 'view_details' },
          { label: 'Dismiss', action: 'dismiss' }
        ]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ User notification sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to send user notification:', error.response?.data || error.message);
    }
  },

  // Send to multiple users
  sendToUsers: async (userIds, token) => {
    try {
      const response = await axios.post(`${API_BASE}/notifications/users`, {
        userIds,
        notification: {
          title: 'Team Announcement',
          message: 'This is a team-wide notification',
          notificationType: 'info',
          priority: 'normal'
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Multi-user notification sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to send multi-user notification:', error.response?.data || error.message);
    }
  },

  // Send broadcast notification
  sendBroadcast: async (token) => {
    try {
      const response = await axios.post(`${API_BASE}/notifications/broadcast`, {
        title: 'System Announcement',
        message: 'This is a broadcast notification to all connected users',
        notificationType: 'system',
        priority: 'high',
        actions: [
          { label: 'Learn More', action: 'learn_more' }
        ]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Broadcast notification sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to send broadcast notification:', error.response?.data || error.message);
    }
  },

  // Send system notification
  sendSystemNotification: async (userId, token) => {
    try {
      const response = await axios.post(`${API_BASE}/notifications/system/${userId}`, {
        type: 'task_assigned',
        data: {
          taskId: 'task-123',
          taskTitle: 'Implement new feature',
          projectId: 'project-456'
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ System notification sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to send system notification:', error.response?.data || error.message);
    }
  },

  // Send manager notification
  sendManagerNotification: async (managerId, token) => {
    try {
      const response = await axios.post(`${API_BASE}/notifications/manager/${managerId}`, {
        type: 'employee_clocked_in',
        data: {
          employeeId: 'emp-123',
          employeeName: 'John Doe',
          clockInTime: new Date().toISOString()
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Manager notification sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to send manager notification:', error.response?.data || error.message);
    }
  },

  // Get notification stats
  getStats: async (token) => {
    try {
      const response = await axios.get(`${API_BASE}/notifications/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📊 Notification stats:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get stats:', error.response?.data || error.message);
    }
  }
};

// Example usage
async function runTests() {
  console.log('🚀 Testing Push Notifications...\n');
  
  // You need to replace this with a real JWT token
  if (TEST_TOKEN === 'your-jwt-token-here') {
    console.log('❌ Please replace TEST_TOKEN with a real JWT token');
    console.log('   You can get a token by logging in through the frontend');
    return;
  }

  try {
    // Test 1: Send to specific user
    console.log('📤 Test 1: Send to specific user');
    await testNotifications.sendToUser('user-123', TEST_TOKEN);
    
    // Test 2: Send to multiple users
    console.log('\n📤 Test 2: Send to multiple users');
    await testNotifications.sendToUsers(['user-123', 'user-456'], TEST_TOKEN);
    
    // Test 3: Send broadcast
    console.log('\n📢 Test 3: Send broadcast');
    await testNotifications.sendBroadcast(TEST_TOKEN);
    
    // Test 4: Send system notification
    console.log('\n🔧 Test 4: Send system notification');
    await testNotifications.sendSystemNotification('user-123', TEST_TOKEN);
    
    // Test 5: Send manager notification
    console.log('\n👨‍💼 Test 5: Send manager notification');
    await testNotifications.sendManagerNotification('manager-123', TEST_TOKEN);
    
    // Test 6: Get stats
    console.log('\n📊 Test 6: Get notification stats');
    await testNotifications.getStats(TEST_TOKEN);
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export default testNotifications;
