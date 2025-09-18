#!/usr/bin/env node

/**
 * Test script to send notifications to desktop app
 * Usage: node test-desktop-notifications.js
 */

import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';
const TEST_TOKEN = 'your-jwt-token-here'; // Replace with actual JWT token

// Test notification for desktop app
const testDesktopNotification = async () => {
  try {
    console.log('🔔 Testing desktop app notifications...');
    
    // Send a test notification
    const response = await axios.post(`${API_BASE}/notifications/broadcast`, {
      title: 'Desktop App Test',
      message: 'This is a test notification for the desktop app. If you see this, the notification system is working!',
      notificationType: 'info',
      priority: 'high',
      actions: [
        { label: 'Test Action', action: 'test_action' }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Test notification sent successfully!');
    console.log('📱 Check your desktop app for the notification');
    console.log('🔔 Look for the notification bell in the top-right corner');
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send test notification:', error.response?.data || error.message);
    throw error;
  }
};

// Send multiple test notifications
const sendMultipleNotifications = async () => {
  const notifications = [
    {
      title: 'Task Assignment',
      message: 'You have been assigned a new task: Implement notification system',
      notificationType: 'task',
      priority: 'high'
    },
    {
      title: 'Break Reminder',
      message: 'You\'ve been working for a while. Consider taking a break!',
      notificationType: 'reminder',
      priority: 'normal'
    },
    {
      title: 'System Update',
      message: 'The system has been updated with new features',
      notificationType: 'system',
      priority: 'low'
    }
  ];
  
  for (let i = 0; i < notifications.length; i++) {
    try {
      console.log(`📤 Sending notification ${i + 1}/${notifications.length}...`);
      
      await axios.post(`${API_BASE}/notifications/broadcast`, notifications[i], {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Notification ${i + 1} sent successfully!`);
      
      // Wait 2 seconds between notifications
      if (i < notifications.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Failed to send notification ${i + 1}:`, error.response?.data || error.message);
    }
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Desktop App Notification Tests...\n');
  
  if (TEST_TOKEN === 'your-jwt-token-here') {
    console.log('❌ Please replace TEST_TOKEN with a real JWT token');
    console.log('   You can get a token by logging in through the frontend');
    console.log('   Or use the notification management page at: http://localhost:5173/notifications');
    return;
  }
  
  try {
    // Test 1: Single notification
    console.log('📋 Test 1: Single notification');
    await testDesktopNotification();
    
    console.log('\n⏳ Waiting 3 seconds before next test...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Multiple notifications
    console.log('📋 Test 2: Multiple notifications');
    await sendMultipleNotifications();
    
    console.log('\n✅ All tests completed!');
    console.log('\n📱 Check your desktop app for notifications:');
    console.log('   - Look for the 🔔 notification bell in the top-right corner');
    console.log('   - Click the bell to see all notifications');
    console.log('   - Check for browser notifications (system notifications)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export default { testDesktopNotification, sendMultipleNotifications, runTests };
