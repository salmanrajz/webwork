const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

// Test the restriction system
async function testRestrictions() {
  try {
    console.log('🧪 Testing restriction system...\n');

    // First, let's check if we can get the rules without authentication
    console.log('1. Checking restriction rules (without auth)...');
    try {
      const response = await axios.get(`${API_BASE}/restrictions/rules`);
      console.log('✅ Rules accessible:', response.data);
    } catch (error) {
      console.log('❌ Rules require authentication:', error.response?.data?.message || error.message);
    }

    // Test restriction check for YouTube
    console.log('\n2. Testing restriction check for YouTube...');
    try {
      const response = await axios.post(`${API_BASE}/restrictions/check`, {
        url: 'https://www.youtube.com/watch?v=test',
        domain: 'youtube.com'
      });
      console.log('✅ YouTube check result:', response.data);
    } catch (error) {
      console.log('❌ YouTube check failed:', error.response?.data?.message || error.message);
    }

    // Test restriction check for Facebook
    console.log('\n3. Testing restriction check for Facebook...');
    try {
      const response = await axios.post(`${API_BASE}/restrictions/check`, {
        url: 'https://www.facebook.com',
        domain: 'facebook.com'
      });
      console.log('✅ Facebook check result:', response.data);
    } catch (error) {
      console.log('❌ Facebook check failed:', error.response?.data?.message || error.message);
    }

    // Test restriction check for a work site
    console.log('\n4. Testing restriction check for GitHub (should be allowed)...');
    try {
      const response = await axios.post(`${API_BASE}/restrictions/check`, {
        url: 'https://github.com',
        domain: 'github.com'
      });
      console.log('✅ GitHub check result:', response.data);
    } catch (error) {
      console.log('❌ GitHub check failed:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRestrictions();
