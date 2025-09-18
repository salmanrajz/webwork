const { app, BrowserWindow } = require('electron');

console.log('App object:', typeof app);

app.whenReady().then(() => {
  console.log('App is ready');
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  mainWindow.loadFile('renderer/index.html');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

