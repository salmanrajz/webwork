const { app, BrowserWindow, ipcMain, powerMonitor, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const screenshotDesktop = require('screenshot-desktop');
const dotenv = require('dotenv');
const si = require('systeminformation');

console.log('🔧 Starting WebWork Tracker Desktop App...');
console.log('✅ Electron modules imported successfully');

// Load environment variables
dotenv.config();

// Basic app configuration
let mainWindow;
let tray;
let activityTimer;
let activityContext = null;

// Enhanced tracking variables
let networkActivity = [];
let websiteCategories = {
  work: ['github.com', 'stackoverflow.com', 'google.com', 'microsoft.com', 'slack.com', 'teams.microsoft.com'],
  personal: ['youtube.com', 'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'reddit.com']
};
let productivityMetrics = {
  totalWorkSites: 0,
  totalPersonalSites: 0,
  productivityScore: 0.5,
  focusTime: 0,
  distractionTime: 0
};

// API configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const withAuth = (token) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Create main window
const createWindow = () => {
  console.log('🔧 Creating main window...');
  
  mainWindow = new BrowserWindow({
    width: 420,
    height: 640,
    minWidth: 380,
    minHeight: 500,
    maxWidth: 1200,
    maxHeight: 1000,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closable: true,
    title: 'WebWork Tracker',
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    }
  });

  // macOS-specific configurations
  if (process.platform === 'darwin') {
    mainWindow.setTitleBarStyle('default');
  }

  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Hide window on close instead of quitting (minimize to tray)
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  console.log('✅ Main window created successfully');
};

// Create system tray
const createTray = () => {
  console.log('🔧 Creating system tray...');
  
  const trayIcon = process.platform === 'darwin' 
    ? path.join(__dirname, '..', 'build', 'tray-icon.png')
    : path.join(__dirname, '..', 'build', 'tray-icon.ico');

  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('WebWork Tracker');
  
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  console.log('✅ System tray created successfully');
};

// Activity monitoring functions
const getActiveWindow = async () => {
  try {
    const activeWin = require('active-win');
    return await activeWin();
  } catch (error) {
    console.error('Error getting active window:', error);
    return null;
  }
};

const analyzeNetworkActivity = async (windowInfo) => {
  if (!windowInfo?.url) {
    return null;
  }

  try {
    const url = windowInfo.url;
    const domain = new URL(url).hostname;

    console.log(`🔍 Monitoring activity: ${domain} (${url})`);

    // Check for restrictions
    let restrictionInfo = null;
    if (activityContext?.token) {
      try {
        const client = withAuth(activityContext.token);
        const response = await client.post('/restrictions/check', {
          url: url,
          domain: domain
        });

        if (response.data.success && response.data.data.isRestricted) {
          restrictionInfo = response.data.data;
          console.log(`🚫 RESTRICTION VIOLATION: ${domain} is blocked!`);

          // Record violation
          if (restrictionInfo.rules.length > 0) {
            const rule = restrictionInfo.rules[0];
            await client.post('/restrictions/violations', {
              ruleId: rule.id,
              targetUrl: url,
              targetDomain: domain,
              violationType: 'blocked_access',
              duration: 0,
              metadata: {
                windowTitle: windowInfo.title,
                appName: windowInfo.owner?.name
              }
            });

            // Show restriction alert
            showRestrictionAlert(rule, url, domain);
          }
        }
      } catch (error) {
        console.error('Restriction check failed:', error);
      }
    }

    // Categorize website
    let category = 'unknown';
    let isWorkRelated = false;

    websiteCategories.work.forEach(site => {
      if (domain.includes(site)) {
        category = 'work';
        isWorkRelated = true;
        productivityMetrics.totalWorkSites++;
      }
    });

    websiteCategories.personal.forEach(site => {
      if (domain.includes(site)) {
        category = 'personal';
        productivityMetrics.totalPersonalSites++;
      }
    });

    // Update productivity score
    const totalSites = productivityMetrics.totalWorkSites + productivityMetrics.totalPersonalSites;
    if (totalSites > 0) {
      productivityMetrics.productivityScore = productivityMetrics.totalWorkSites / totalSites;
    }

    return {
      domain,
      category,
      isWorkRelated,
      restrictionInfo,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Network analysis failed:', error);
    return null;
  }
};

const showRestrictionAlert = (rule, url, domain) => {
  const severity = rule.severity || 'medium';
  const alertMessage = rule.alertMessage || `Access to ${domain} is restricted`;

  // Show desktop notification
  new Notification(`🚫 Restricted Site Detected`, {
    body: alertMessage,
    icon: path.join(__dirname, '..', 'build', 'icon.png')
  });

  // Send alert to renderer
  if (mainWindow) {
    mainWindow.webContents.send('restriction-alert', {
      rule,
      url,
      domain,
      message: alertMessage,
      severity
    });
  }

  console.log(`Restriction Alert: ${alertMessage} (Severity: ${severity})`);
};

const captureActivitySample = async () => {
  if (!activityContext) {
    console.log(`❌ No activity context - user not logged in`);
    return;
  }

  try {
    console.log(`🔍 Capturing activity sample...`);
    const [windowInfo, load] = await Promise.all([getActiveWindow(), si.currentLoad()]);
    const idleSeconds = powerMonitor.getSystemIdleTime();
    const durationSeconds = Math.round(5000 / 1000); // 5 second intervals
    const timestamp = new Date();

    console.log(`🔍 Activity sample captured:`, {
      hasWindowInfo: !!windowInfo,
      hasUrl: !!windowInfo?.url,
      idleSeconds,
      timestamp: timestamp.toISOString()
    });

    // Analyze network activity
    const networkAnalysis = await analyzeNetworkActivity(windowInfo);
    if (networkAnalysis) {
      networkActivity.push(networkAnalysis);
    }

    // Send status to renderer
    if (mainWindow) {
      mainWindow.webContents.send('activity-update', {
        type: 'activity-sample',
        data: {
          windowInfo,
          load,
          idleSeconds,
          durationSeconds,
          timestamp: timestamp.toISOString(),
          networkAnalysis,
          productivityMetrics
        }
      });
    }
  } catch (error) {
    console.error('Activity capture failed:', error);
  }
};

const startActivityTracking = (context) => {
  console.log('🔍 Starting activity tracking with context:', context);
  console.log('🔍 User logged in:', !!context?.user);
  console.log('🔍 Token available:', !!context?.token);

  stopActivityTracking();
  activityContext = context;
  console.log('🔍 Starting activity sample capture...');
  captureActivitySample();
  console.log('🔍 Setting up activity timer...');
  activityTimer = setInterval(captureActivitySample, 5000); // 5 second intervals
  console.log('✅ Activity tracking started successfully!');
};

const stopActivityTracking = () => {
  if (activityTimer) {
    clearInterval(activityTimer);
    activityTimer = null;
  }
  activityContext = null;
  console.log('🛑 Activity tracking stopped');
};

// IPC handlers
if (ipcMain) {
  ipcMain.handle('auth:login', async (_event, credentials) => {
  try {
    console.log('Attempting login with credentials:', { email: credentials.email });
    const { data } = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    console.log('Login successful:', data);
    return data.data;
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error?.response?.data?.message ||
                        error?.response?.statusText ||
                        error?.message ||
                        'Login failed';
    throw new Error(errorMessage);
  }
});

ipcMain.handle('auth:logout', async () => {
  stopActivityTracking();
  return { success: true };
});

ipcMain.handle('tracker:start', async (_event, context) => {
  startActivityTracking(context);
  return { success: true };
});

  ipcMain.handle('tracker:stop', async () => {
    stopActivityTracking();
    return { success: true };
  });
}

// App event handlers
app.whenReady().then(() => {
  console.log('✅ App is ready, creating window...');
  createWindow();
  
  // Delay tray creation to ensure app is fully loaded
  setTimeout(() => {
    createTray();
  }, 1000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
  stopActivityTracking();
});

console.log('✅ WebWork Tracker Desktop App initialized successfully');
