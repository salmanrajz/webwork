const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testAuthenticatedRestrictions() {
  try {
    console.log('🧪 Testing authenticated restriction system...\n');

    // Step 1: Login to get a token
    console.log('1. Logging in to get authentication token...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@webwork.dev',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, got token');

    // Step 2: Test restriction check for YouTube
    console.log('\n2. Testing YouTube restriction check...');
    const youtubeResponse = await axios.post(`${API_BASE}/restrictions/check`, {
      url: 'https://www.youtube.com/watch?v=test',
      domain: 'youtube.com'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ YouTube check result:', youtubeResponse.data);

    // Step 3: Test restriction check for Facebook
    console.log('\n3. Testing Facebook restriction check...');
    const facebookResponse = await axios.post(`${API_BASE}/restrictions/check`, {
      url: 'https://www.facebook.com',
      domain: 'facebook.com'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Facebook check result:', facebookResponse.data);

    // Step 4: Test restriction check for GitHub (should be allowed)
    console.log('\n4. Testing GitHub restriction check (should be allowed)...');
    const githubResponse = await axios.post(`${API_BASE}/restrictions/check`, {
      url: 'https://github.com',
      domain: 'github.com'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ GitHub check result:', githubResponse.data);

    console.log('\n🎯 Summary:');
    console.log('- YouTube should be RESTRICTED:', youtubeResponse.data.data.isRestricted);
    console.log('- Facebook should be RESTRICTED:', facebookResponse.data.data.isRestricted);
    console.log('- GitHub should be ALLOWED:', !githubResponse.data.data.isRestricted);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testAuthenticatedRestrictions();

