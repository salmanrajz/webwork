// Test script to verify GPS system is working
const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

// Test credentials
const testCredentials = {
  email: 'emma@webwork.dev',
  password: 'Password123!'
};

async function testGpsSystem() {
  console.log('🧪 Testing GPS System...\n');

  try {
    // 1. Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, testCredentials);
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token received');

    // 2. Test GPS live endpoint
    console.log('\n2️⃣ Testing GPS live endpoint...');
    try {
      const liveResponse = await axios.get(`${API_BASE_URL}/gps/live`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ GPS live endpoint working:', liveResponse.data);
    } catch (error) {
      console.log('❌ GPS live endpoint failed:', error.response?.data || error.message);
    }

    // 3. Test GPS points endpoint (simulate desktop app sending data)
    console.log('\n3️⃣ Testing GPS points endpoint...');
    const mockGpsData = {
      points: [{
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        speed: 0,
        heading: 0,
        altitude: 0,
        timestamp: new Date().toISOString(),
        source: 'desktop',
        clientOs: 'macOS',
        clientApp: 'desktop',
        battery: 100,
        isMoving: false
      }],
      sessionId: 'test-session-123'
    };

    try {
      const pointsResponse = await axios.post(`${API_BASE_URL}/gps/points`, mockGpsData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ GPS points endpoint working:', pointsResponse.data);
    } catch (error) {
      console.log('❌ GPS points endpoint failed:', error.response?.data || error.message);
    }

    // 4. Test geofences endpoint
    console.log('\n4️⃣ Testing geofences endpoint...');
    try {
      const geofencesResponse = await axios.get(`${API_BASE_URL}/gps/geofences`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Geofences endpoint working:', geofencesResponse.data);
    } catch (error) {
      console.log('❌ Geofences endpoint failed:', error.response?.data || error.message);
    }

    console.log('\n🎯 GPS System Test Complete!');
    console.log('\n📱 To test real GPS tracking:');
    console.log('1. Open desktop app');
    console.log('2. Login with emma@webwork.dev / Password123!');
    console.log('3. Start a timer');
    console.log('4. Allow location permission when prompted');
    console.log('5. Check activity log for GPS coordinates');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGpsSystem();
