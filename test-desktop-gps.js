// Test script to check if desktop app is requesting location permission
const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing Desktop App GPS Functionality');
console.log('==========================================\n');

// Check if desktop app is running
const checkDesktopApp = () => {
  return new Promise((resolve) => {
    const ps = spawn('ps', ['aux']);
    let output = '';
    
    ps.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ps.on('close', () => {
      const isRunning = output.includes('Electron') && output.includes('webwork');
      resolve(isRunning);
    });
  });
};

// Test GPS permission request
const testGpsPermission = () => {
  console.log('🔍 Testing GPS Permission Request...');
  
  // Check if navigator.geolocation is available
  if (typeof navigator === 'undefined') {
    console.log('❌ navigator not available in Node.js environment');
    return false;
  }
  
  if (!navigator.geolocation) {
    console.log('❌ navigator.geolocation not available');
    return false;
  }
  
  console.log('✅ navigator.geolocation is available');
  return true;
};

// Main test function
async function main() {
  console.log('1. Checking if desktop app is running...');
  const isRunning = await checkDesktopApp();
  
  if (isRunning) {
    console.log('✅ Desktop app is running');
  } else {
    console.log('❌ Desktop app is not running');
    console.log('   Please start the desktop app first:');
    console.log('   cd /Users/salman/Documents/projects/webwork/desktop && npm start');
    return;
  }
  
  console.log('\n2. Testing GPS functionality...');
  const gpsAvailable = testGpsPermission();
  
  if (gpsAvailable) {
    console.log('✅ GPS functionality is available');
  } else {
    console.log('❌ GPS functionality is not available');
  }
  
  console.log('\n3. Instructions for testing GPS:');
  console.log('   a) Open the desktop app');
  console.log('   b) Login with: emma@webwork.dev / Password123!');
  console.log('   c) Select a task');
  console.log('   d) Click "Start" button');
  console.log('   e) Check if location permission dialog appears');
  console.log('   f) Check terminal logs for GPS data');
  
  console.log('\n4. Expected GPS logs in terminal:');
  console.log('   📍 GPS data received: [latitude] [longitude]');
  console.log('   ✅ GPS data sent to backend');
  console.log('   GPS: [lat], [lng] ([accuracy]m)');
  
  console.log('\n5. If no GPS logs appear:');
  console.log('   - Check if location permission was granted');
  console.log('   - Check if GPS is enabled in system settings');
  console.log('   - Check if the app is requesting location permission');
}

main().catch(console.error);
