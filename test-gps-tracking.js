// Test script to simulate GPS tracking every 5 seconds
const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

// Test credentials
const testCredentials = {
  email: 'emma@webwork.dev',
  password: 'Password123!'
};

let token = null;
let intervalId = null;

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, testCredentials);
    token = response.data.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    return false;
  }
}

async function sendGpsData(latitude, longitude, accuracy = 10) {
  try {
    const gpsData = {
      points: [{
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy,
        speed: Math.random() * 5, // Random speed 0-5 m/s
        heading: Math.random() * 360, // Random heading 0-360 degrees
        altitude: Math.random() * 100, // Random altitude 0-100m
        timestamp: new Date().toISOString(),
        source: 'desktop',
        clientOs: 'macOS',
        clientApp: 'desktop',
        battery: Math.floor(Math.random() * 100), // Random battery 0-100%
        isMoving: Math.random() > 0.5 // Random moving/stationary
      }],
      sessionId: 'test-session-' + Date.now()
    };

    const response = await axios.post(`${API_BASE_URL}/gps/points`, gpsData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`📍 GPS sent: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${accuracy}m) - ${response.data.message}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send GPS data:', error.message);
    return false;
  }
}

async function checkLivePositions() {
  try {
    const response = await axios.get(`${API_BASE_URL}/gps/live`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('📊 Live positions:', response.data.data.length, 'users');
    response.data.data.forEach(pos => {
      console.log(`  👤 ${pos.user.name}: ${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)} (${pos.accuracy}m)`);
    });
  } catch (error) {
    console.error('❌ Failed to get live positions:', error.message);
  }
}

async function startGpsTracking() {
  console.log('🚀 Starting GPS tracking simulation...');
  console.log('📍 Sending GPS data every 5 seconds');
  console.log('🔄 Press Ctrl+C to stop\n');

  // Start location (New York City)
  let latitude = 40.7128;
  let longitude = -74.0060;
  let accuracy = 10;

  // Send initial GPS data
  await sendGpsData(latitude, longitude, accuracy);
  await checkLivePositions();

  // Start interval for continuous GPS tracking
  intervalId = setInterval(async () => {
    // Simulate movement (small random changes)
    latitude += (Math.random() - 0.5) * 0.0001; // Small random movement
    longitude += (Math.random() - 0.5) * 0.0001;
    accuracy = 5 + Math.random() * 10; // Accuracy between 5-15m

    await sendGpsData(latitude, longitude, accuracy);
    
    // Check live positions every 30 seconds
    if (Date.now() % 30000 < 5000) {
      await checkLivePositions();
    }
  }, 5000); // Every 5 seconds
}

async function stopGpsTracking() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('\n🛑 GPS tracking stopped');
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Stopping GPS tracking...');
  await stopGpsTracking();
  process.exit(0);
});

// Main execution
async function main() {
  console.log('🧪 GPS Tracking Test');
  console.log('===================\n');

  const loggedIn = await login();
  if (!loggedIn) {
    console.error('❌ Cannot proceed without login');
    process.exit(1);
  }

  await startGpsTracking();
}

main().catch(console.error);
