console.log('Testing minimal Electron...');

// Try to import Electron
try {
  const electron = require('electron');
  console.log('Electron module loaded:', typeof electron);
  console.log('Electron keys:', Object.keys(electron));
  
  const { app } = electron;
  console.log('App from electron:', typeof app);
  
  if (app) {
    console.log('✅ App object exists');
    app.whenReady().then(() => {
      console.log('✅ App ready');
      process.exit(0);
    });
  } else {
    console.log('❌ App object is null/undefined');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
