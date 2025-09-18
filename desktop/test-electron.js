console.log('Testing Electron import...');

try {
  const { app, BrowserWindow } = require('electron');
  console.log('Electron imported successfully');
  console.log('App object type:', typeof app);
  console.log('App object:', app);
  
  if (app && typeof app.whenReady === 'function') {
    console.log('✅ App object is valid');
    app.whenReady().then(() => {
      console.log('✅ App is ready');
      process.exit(0);
    });
  } else {
    console.log('❌ App object is invalid');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error importing Electron:', error.message);
  process.exit(1);
}
