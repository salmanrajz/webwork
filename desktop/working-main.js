// This is a working Electron main process
const { app, BrowserWindow } = require('electron');
const path = require('path');

console.log('🔧 Starting working Electron app...');

// This should work because we're in the main process
app.whenReady().then(() => {
  console.log('✅ App is ready!');
  
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the renderer
  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));
  
  console.log('✅ Window created and loaded');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    // Re-create window
  }
});

console.log('✅ Working Electron app setup complete');
