console.log('Simple main.js test...');

try {
  const electron = require('electron');
  console.log('Electron module type:', typeof electron);
  console.log('Electron keys:', Object.keys(electron));
  
  if (typeof electron === 'string') {
    console.log('Electron is a string path - this is correct behavior');
    console.log('The API is only available when running as the main process');
    return;
  }
  
  const { app, BrowserWindow } = electron;
  console.log('App type:', typeof app);
  console.log('BrowserWindow type:', typeof BrowserWindow);

  if (app) {
    console.log('App is available!');
    app.whenReady().then(() => {
      console.log('App is ready!');
      
      const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      });
      
      mainWindow.loadFile('src/renderer/index.html');
      console.log('Window created and loaded!');
    });
  } else {
    console.log('App is undefined - this is the problem!');
  }
} catch (error) {
  console.error('Error importing Electron:', error);
}
