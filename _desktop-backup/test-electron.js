console.log('Testing Electron import...');

try {
  // Try different import methods
  console.log('Method 1: Direct destructuring');
  const { app, BrowserWindow } = require('electron');
  console.log('App type:', typeof app);
  console.log('BrowserWindow type:', typeof BrowserWindow);
  
  if (app) {
    console.log('App is available, calling whenReady...');
    app.whenReady().then(() => {
      console.log('App is ready!');
      app.quit();
    });
  } else {
    console.log('App is undefined - trying method 2...');
    
    // Method 2: Import the module first
    const electron = require('electron');
    console.log('Electron module type:', typeof electron);
    console.log('Electron keys:', Object.keys(electron));
    
    if (typeof electron === 'string') {
      console.log('Electron is a string path:', electron);
      console.log('This is the correct behavior - the API is only available in the main process');
    }
  }
} catch (error) {
  console.error('Electron import failed:', error);
}
