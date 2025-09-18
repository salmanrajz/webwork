const { app, BrowserWindow } = require('electron');
const path = require('path');

console.log('🔧 Starting simple Electron test...');
console.log('App object type:', typeof app);
console.log('App object:', app);

// This should work in a proper Electron context
app.whenReady().then(() => {
  console.log('✅ App is ready!');
  
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));
  
  console.log('✅ Window created successfully');
  
  // Keep the app running
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    // Re-create window
  }
});

console.log('✅ Simple Electron app setup complete');
