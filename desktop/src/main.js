const { app, BrowserWindow, ipcMain, powerMonitor, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const screenshotDesktop = require('screenshot-desktop');
const dotenv = require('dotenv');
const si = require('systeminformation');
// const sharp = require('sharp'); // Temporarily disabled for Windows build
let activeWinModule;
let uIOhook;
let inputHooksAvailable = false;
let breakReminderInterval = null;
let lastActivityTime = Date.now();
let userBreakSettings = {
  breakReminderInterval: 60, // default 60 minutes
  breakReminderEnabled: true,
  dailyTargetHours: 8
};

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

try {
  ({ uIOhook } = require('uiohook-napi'));
  inputHooksAvailable = process.platform === 'win32';
} catch (error) {
  console.warn('Input hooks disabled:', error.message);
}

const silenceLogs =
  app && app.isPackaged && (process.env.WEBWORK_SILENCE_LOGS || '').toLowerCase() !== 'false';

if (silenceLogs) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  app.commandLine.appendSwitch('disable-logging');
}

const developmentEnvPath = path.join(__dirname, '..', '.env');
const productionEnvPath = app
  ? path.join(process.resourcesPath, '.env')
  : path.join(__dirname, '..', '.env');
if (!process.env.API_BASE_URL) {
  if (app && app.isPackaged && fs.existsSync(productionEnvPath)) {
    dotenv.config({ path: productionEnvPath, override: true });
  } else if (fs.existsSync(developmentEnvPath)) {
    dotenv.config({ path: developmentEnvPath, override: true });
  }
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';
const SCREENSHOT_INTERVAL_MS = Math.max(
  Number(process.env.SCREENSHOT_INTERVAL_MINUTES || 5) * 60 * 1000,
  60000
);
const ACTIVITY_INTERVAL_MS = Math.max(
  Number(process.env.ACTIVITY_INTERVAL_SECONDS || 15) * 1000,
  5000
);

// Performance optimizations
const optimizePerformance = () => {
  // Reduce memory usage
  if (process.platform === 'darwin') {
    app.dock.setBadge('');
  }
  
  // Optimize garbage collection
  if (global.gc) {
    setInterval(() => {
      global.gc();
    }, 60000); // Run GC every minute
  }
};

let mainWindow = null;
let tray = null;
let captureTimer = null;
let captureContext = null;
let activityTimer = null;
let activityContext = null;
let keyboardCount = 0;
let mouseCount = 0;
let keystrokeBuffer = [];
let inputHooksActive = false;
let keydownHandler;
let mouseDownHandler;
let mouseUpHandler;
let wheelHandler;
const KEYSTROKE_LIMIT = 200;

const api = axios.create({ baseURL: API_BASE_URL });

const withAuth = (token) =>
  axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

const sendStatus = (payload) => {
  if (mainWindow) {
    mainWindow.webContents.send('tracker:status', payload);
  }
};

const stopScreenshotCapture = () => {
  if (captureTimer) {
    clearInterval(captureTimer);
    captureTimer = null;
  }
  captureContext = null;
};

// Smart screenshot analysis function (simplified for Windows build)
const analyzeScreenshot = async (screenshotBuffer) => {
  try {
    // Simplified analysis without sharp dependency
    const analysis = {
      width: 1920, // Default values
      height: 1080,
      channels: 3,
      detectedWindows: [],
      tabTitles: [],
      websiteCategories: [],
      productivityScore: 0.5,
      browserWindows: 0,
      workRelatedSites: 0,
      personalSites: 0
    };

    console.log('Screenshot analysis completed (simplified):', {
      browserWindows: analysis.browserWindows,
      workSites: analysis.workRelatedSites,
      personalSites: analysis.personalSites,
      productivityScore: analysis.productivityScore
    });

    return analysis;
  } catch (error) {
    console.error('Screenshot analysis failed:', error);
    return {
      detectedWindows: [],
      tabTitles: [],
      websiteCategories: [],
      productivityScore: 0.5,
      browserWindows: 0,
      workRelatedSites: 0,
      personalSites: 0
    };
  }
};

const captureAndUpload = async () => {
  if (!captureContext) return;
  try {
    const buffer = await screenshotDesktop({ format: 'png' });
    const timestamp = new Date();

    // Analyze screenshot for enhanced insights
    const analysis = await analyzeScreenshot(buffer);
    
    const form = new FormData();
    form.append('screenshot', buffer, {
      filename: `capture-${timestamp.getTime()}.png`,
      contentType: 'image/png'
    });
    form.append('capturedAt', timestamp.toISOString());
    form.append('analysis', JSON.stringify(analysis));
    
    if (captureContext.taskId) {
      form.append('taskId', captureContext.taskId);
    }
    if (captureContext.timeLogId) {
      form.append('timeLogId', captureContext.timeLogId);
    }

    const client = withAuth(captureContext.token);
    await client.post('/screenshots', form, { headers: form.getHeaders() });

    sendStatus({ 
      type: 'capture', 
      timestamp: timestamp.toISOString(),
      analysis: analysis
    });
  } catch (error) {
    console.error('Failed to capture screenshot', error.message);
    sendStatus({ type: 'error', message: error.message });
  }
};

const startScreenshotCapture = (context) => {
  stopScreenshotCapture();
  captureContext = context;
  captureAndUpload();
  captureTimer = setInterval(captureAndUpload, SCREENSHOT_INTERVAL_MS);
};

const getActiveWindow = async () => {
  try {
    if (!activeWinModule) {
      activeWinModule = await import('active-win');
    }
    const resolver = activeWinModule.default || activeWinModule;
    return await resolver();
  } catch (error) {
    return null;
  }
};

const recordKeyEvent = ({ key, keyCode }) => {
  keyboardCount += 1;
  keystrokeBuffer.push({
    key: key || null,
    keyCode: keyCode ?? null,
    timestamp: new Date().toISOString()
  });
  if (keystrokeBuffer.length > KEYSTROKE_LIMIT) {
    keystrokeBuffer.splice(0, keystrokeBuffer.length - KEYSTROKE_LIMIT);
  }
};

const recordMouseEvent = () => {
  mouseCount += 1;
};

const startInputHooks = () => {
  if (!inputHooksAvailable || inputHooksActive) return;
  keyboardCount = 0;
  mouseCount = 0;
  keystrokeBuffer = [];

  keydownHandler = (event) => {
    const keyChar = event.keychar ? String.fromCharCode(event.keychar) : null;
    recordKeyEvent({ key: keyChar, keyCode: event.keycode || event.rawcode || null });
  };
  mouseDownHandler = () => recordMouseEvent();
  mouseUpHandler = () => recordMouseEvent();
  wheelHandler = () => recordMouseEvent();

  uIOhook.on('keydown', keydownHandler);
  uIOhook.on('mousedown', mouseDownHandler);
  uIOhook.on('mouseup', mouseUpHandler);
  uIOhook.on('wheel', wheelHandler);
  uIOhook.start();
  inputHooksActive = true;
};

const stopInputHooks = () => {
  if (!inputHooksAvailable || !inputHooksActive) return;
  uIOhook.removeListener('keydown', keydownHandler);
  uIOhook.removeListener('mousedown', mouseDownHandler);
  uIOhook.removeListener('mouseup', mouseUpHandler);
  uIOhook.removeListener('wheel', wheelHandler);
  uIOhook.stop();
  inputHooksActive = false;
  keyboardCount = 0;
  mouseCount = 0;
  keystrokeBuffer = [];
};

const stopActivityTracking = () => {
  if (activityTimer) {
    clearInterval(activityTimer);
    activityTimer = null;
  }
  activityContext = null;
};

// Enhanced network monitoring
const analyzeNetworkActivity = (windowInfo) => {
  if (!windowInfo?.url) return null;
  
  try {
    const url = windowInfo.url;
    const domain = new URL(url).hostname;
    
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
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Network analysis failed:', error);
    return null;
  }
};

const captureActivitySample = async () => {
  if (!activityContext) return;
  try {
    const [windowInfo, load] = await Promise.all([getActiveWindow(), si.currentLoad()]);
    const idleSeconds = powerMonitor.getSystemIdleTime();
    const durationSeconds = Math.round(ACTIVITY_INTERVAL_MS / 1000);
    const timestamp = new Date();

    // Analyze network activity
    const networkAnalysis = analyzeNetworkActivity(windowInfo);
    if (networkAnalysis) {
      networkActivity.push(networkAnalysis);
      // Keep only last 100 network activities
      if (networkActivity.length > 100) {
        networkActivity = networkActivity.slice(-100);
      }
    }

    // Calculate enhanced productivity metrics
    const isIdle = idleSeconds > 30;
    const isProductive = networkAnalysis?.isWorkRelated || false;
    
    if (!isIdle) {
      if (isProductive) {
        productivityMetrics.focusTime += durationSeconds;
      } else {
        productivityMetrics.distractionTime += durationSeconds;
      }
    }

    const payload = {
      capturedAt: timestamp.toISOString(),
      durationSeconds,
      windowTitle: windowInfo?.title || 'Unknown',
      appName: windowInfo?.owner?.name || 'Unknown',
      url: windowInfo?.url || null,
      idleSeconds,
      activityScore: Math.max(0, Math.min(1, (durationSeconds - idleSeconds) / durationSeconds)),
      cpuUsage: load?.currentload ? Number(load.currentload.toFixed(2)) : 0,
      keyboardCount,
      mouseCount,
      keystrokes: keystrokeBuffer.slice(0, 200),
      taskId: activityContext.taskId,
      timeLogId: activityContext.timeLogId,
      // Enhanced tracking data
      networkAnalysis,
      productivityMetrics: {
        productivityScore: productivityMetrics.productivityScore,
        focusTime: productivityMetrics.focusTime,
        distractionTime: productivityMetrics.distractionTime,
        workSites: productivityMetrics.totalWorkSites,
        personalSites: productivityMetrics.totalPersonalSites
      },
      recentNetworkActivity: networkActivity.slice(-10) // Last 10 network activities
    };

    const client = withAuth(activityContext.token);
    await client.post('/activities', { activities: [payload] });

    sendStatus({
      type: 'activity',
      timestamp: timestamp.toISOString(),
      windowTitle: payload.windowTitle,
      appName: payload.appName,
      url: payload.url,
      idleSeconds,
      cpuUsage: payload.cpuUsage,
      keyboardCount: payload.keyboardCount,
      mouseCount: payload.mouseCount,
      networkAnalysis: payload.networkAnalysis,
      productivityMetrics: payload.productivityMetrics
    });

    keyboardCount = 0;
    mouseCount = 0;
    keystrokeBuffer = [];
  } catch (error) {
    console.error('Failed to record activity', error.message);
    sendStatus({ type: 'error', message: error.message });
  }
};

const startActivityTracking = (context) => {
  stopActivityTracking();
  activityContext = context;
  captureActivitySample();
  activityTimer = setInterval(captureActivitySample, ACTIVITY_INTERVAL_MS);
};

const startTracking = async (context) => {
  startScreenshotCapture(context);
  startActivityTracking(context);
  startInputHooks();
  
  // Fetch break settings before starting reminders
  await fetchBreakSettings();
  startBreakReminders();
  
  sendStatus({ type: 'timer', state: 'running' });
};

const stopTracking = () => {
  stopScreenshotCapture();
  stopActivityTracking();
  stopInputHooks();
};

// Fetch break settings from backend or local storage
const fetchBreakSettings = async () => {
  // Try to load from local storage first
  try {
    const localSettings = JSON.parse(localStorage.getItem('webwork_break_settings') || '{}');
    if (Object.keys(localSettings).length > 0) {
      userBreakSettings = {
        breakReminderInterval: localSettings.breakReminderInterval || 60,
        breakReminderEnabled: localSettings.breakReminderEnabled !== false,
        dailyTargetHours: localSettings.dailyTargetHours || 8
      };
      console.log('Break settings loaded from local storage:', userBreakSettings);
      return;
    }
  } catch (localError) {
    console.warn('Failed to load from local storage:', localError.message);
  }

  // Try backend if available
  try {
    const response = await axios.get(`${API_BASE_URL}/users/me/break-settings`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN || ''}`
      }
    });
    
    if (response.data.success) {
      userBreakSettings = response.data.data;
      console.log('Break settings loaded from backend:', userBreakSettings);
    }
  } catch (error) {
    console.warn('Failed to fetch break settings from backend, using defaults:', error.message);
    // Use defaults
    userBreakSettings = {
      breakReminderInterval: 60,
      breakReminderEnabled: true,
      dailyTargetHours: 8
    };
    console.log('Using default break settings:', userBreakSettings);
  }
};

// Break reminder functionality
const startBreakReminders = () => {
  if (breakReminderInterval) {
    clearInterval(breakReminderInterval);
  }
  
  if (!userBreakSettings.breakReminderEnabled) {
    console.log('Break reminders disabled by user settings');
    return;
  }
  
  // Check every 5 minutes for break reminders
  breakReminderInterval = setInterval(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime;
    const minutesSinceActivity = Math.floor(timeSinceLastActivity / (1000 * 60));
    
    // Use backend-configured break interval
    if (minutesSinceActivity >= userBreakSettings.breakReminderInterval) {
      showBreakReminder();
      lastActivityTime = now; // Reset timer
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
};

const showBreakReminder = () => {
  if (mainWindow) {
    mainWindow.webContents.send('break-reminder');
  }
  
  // Show system notification
  if (process.platform === 'darwin') {
    new Notification('Time for a break!', {
      body: 'You\'ve been working for a while. Take a 5-minute break to stay productive!',
      icon: path.join(__dirname, '..', 'build', 'icon.png')
    });
  }
};

// Enhanced notification system
const showEnhancedNotification = (title, body, options = {}) => {
  const notificationOptions = {
    body: body,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    sound: options.sound || false,
    silent: options.silent || false,
    ...options
  };
  
  if (process.platform === 'darwin') {
    new Notification(title, notificationOptions);
  }
  
  // Also send to renderer for in-app notifications
  if (mainWindow) {
    mainWindow.webContents.send('enhanced-notification', { title, body, options });
  }
};

// Daily summary notification
const showDailySummary = () => {
  const now = new Date();
  const hours = now.getHours();
  
  if (hours >= 17) { // After 5 PM
    showEnhancedNotification(
      'Daily Summary',
      'Great work today! Check your productivity dashboard for insights.',
      { sound: true }
    );
  }
};

const createTray = () => {
  let iconPath;
  
  // Try different icon sizes on macOS
  if (process.platform === 'darwin') {
    const simpleIcon = path.join(__dirname, '..', 'build', 'simple-tray.png');
    const icon16 = path.join(__dirname, '..', 'build', 'tray-icon-16.png');
    const icon22 = path.join(__dirname, '..', 'build', 'tray-icon.png');
    
    if (fs.existsSync(simpleIcon)) {
      iconPath = simpleIcon;
    } else if (fs.existsSync(icon16)) {
      iconPath = icon16;
    } else if (fs.existsSync(icon22)) {
      iconPath = icon22;
    } else {
      iconPath = path.join(__dirname, '..', 'build', 'icon.png');
    }
  } else {
    iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  }
  
  console.log('Looking for tray icon at:', iconPath);
  
  if (!fs.existsSync(iconPath)) {
    console.warn('Tray icon not found at:', iconPath);
    return;
  }
  
  console.log('Tray icon found, creating tray...');
  
  try {
    tray = new Tray(iconPath);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show WebWork Tracker',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Start Tracking',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.send('tray:start-tracking');
          }
        }
      },
      {
        label: 'Stop Tracking',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.send('tray:stop-tracking');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    ]);
    
    tray.setContextMenu(contextMenu);
    tray.setToolTip('WebWork Tracker - Time tracking app');
    
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
    
    // Force tray to be visible
    tray.setIgnoreDoubleClickEvents(true);
    
    // Make sure tray is visible on macOS
    if (process.platform === 'darwin') {
      tray.setTitle('WebWork Tracker');
    }
    
    console.log('System tray created successfully');
    console.log('Tray icon path:', iconPath);
    console.log('Tray is destroyed:', tray.isDestroyed());
    console.log('Tray title:', tray.getTitle());
  } catch (error) {
    console.warn('Failed to create tray:', error.message);
  }
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 640,
    resizable: false,
    title: 'WebWork Tracker',
    show: true, // Show the window initially
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

  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  
  // Hide window on close instead of quitting (minimize to tray)
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
  
  // Handle dock click on macOS
  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
};

// Auto-start functionality
const setupAutoStart = () => {
  if (process.platform === 'darwin') {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true
    });
  } else if (process.platform === 'win32') {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true
    });
  }
};

app.whenReady().then(() => {
  createWindow();
  
  // Delay tray creation to ensure app is fully loaded
  setTimeout(() => {
    createTray();
  }, 1000);
  
  // Set up auto-start
  setupAutoStart();
  
  // Optimize performance
  optimizePerformance();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (powerMonitor) {
    stopTracking();
  }
  // Don't quit on window close - let it run in tray
  // Only quit on macOS when explicitly requested
  if (process.platform !== 'darwin') {
    // On Windows/Linux, keep running in tray
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
  stopTracking();
});

ipcMain.handle('auth:login', async (_event, credentials) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    return data.data;
  } catch (error) {
    const message =
      error?.response?.data?.message || error?.response?.statusText || error?.message || 'Login failed';
    throw { message, status: error?.response?.status, data: error?.response?.data || null };
  }
});

ipcMain.handle('tasks:list', async (_event, { token, assigneeId }) => {
  const client = withAuth(token);
  const { data } = await client.get('/tasks', { params: { assigneeId } });
  return data.data;
});

ipcMain.handle('timelog:active', async (_event, { token }) => {
  const client = withAuth(token);
  const { data } = await client.get('/timelogs/active');
  return data.data;
});

ipcMain.handle('timer:start', async (_event, { token, taskId }) => {
  const client = withAuth(token);
  const { data } = await client.post('/timelogs/start', { taskId });
  const log = data.data;
  startTracking({ token, taskId, timeLogId: log.id });
  return log;
});

ipcMain.handle('timer:resume', async (_event, { token, taskId }) => {
  const client = withAuth(token);
  const { data } = await client.post('/timelogs/resume', { taskId });
  const log = data.data;
  startTracking({ token, taskId, timeLogId: log.id });
  return log;
});

ipcMain.handle('timer:pause', async (_event, { token }) => {
  const client = withAuth(token);
  const { data } = await client.post('/timelogs/pause');
  stopTracking();
  sendStatus({ type: 'timer', state: 'paused' });
  return data.data;
});

ipcMain.handle('timer:stop', async (_event, { token }) => {
  const client = withAuth(token);
  const { data } = await client.post('/timelogs/stop');
  stopTracking();
  sendStatus({ type: 'timer', state: 'stopped' });
  return data.data;
});

ipcMain.on('tracker:logout', () => {
  stopTracking();
  sendStatus({ type: 'timer', state: 'idle' });
});

ipcMain.handle('attendance:clockIn', async (_event, { token, shiftId }) => {
  const client = withAuth(token);
  const { data } = await client.post('/attendance/clock-in', { shiftId });
  return data.data;
});

ipcMain.handle('attendance:clockOut', async (_event, { token }) => {
  const client = withAuth(token);
  const { data } = await client.post('/attendance/clock-out');
  return data.data;
});

ipcMain.handle('attendance:active', async (_event, { token }) => {
  const client = withAuth(token);
  const { data } = await client.get('/attendance/active');
  return data.data;
});

// Break settings IPC handlers
ipcMain.handle('break-settings:get', async (_event, { token }) => {
  const client = withAuth(token);
  const { data } = await client.get('/users/me/break-settings');
  return data.data;
});

ipcMain.handle('break-settings:update', async (_event, { token, settings }) => {
  const client = withAuth(token);
  const { data } = await client.patch('/users/me/break-settings', settings);
  
  // Update local settings
  userBreakSettings = data.data;
  
  // Restart break reminders with new settings
  if (breakReminderInterval) {
    startBreakReminders();
  }
  
  return data.data;
});

app.on('before-quit', () => {
  stopTracking();
});
