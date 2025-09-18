console.log('🔧 Starting WebWork Tracker Desktop App...');

// Import Electron modules
const { app, BrowserWindow, ipcMain, powerMonitor, Tray, Menu, nativeImage } = require('electron');
console.log('✅ Electron modules imported successfully');

// App object will be available when Electron initializes
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const screenshotDesktop = require('screenshot-desktop');
const dotenv = require('dotenv');
const WebSocket = require('ws');
const si = require('systeminformation');
let activeWinModule;
let uIOhook;
let inputHooksAvailable = false;

try {
  ({ uIOhook } = require('uiohook-napi'));
  inputHooksAvailable = process.platform === 'win32';
} catch (error) {
  console.warn('Input hooks disabled:', error.message);
}

const isProduction = false; // Always show logs in development

if (isProduction) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  if (app && app.commandLine) {
    app.commandLine.appendSwitch('disable-logging');
  }
}

const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath, override: true });

// Environment Configuration with Production Support
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'ws://localhost:4000/realtime';
const SCREENSHOT_INTERVAL_MS = Math.max(
  Number(process.env.SCREENSHOT_INTERVAL_MINUTES || 5) * 60 * 1000,
  60000
);
const ACTIVITY_INTERVAL_MS = Math.max(
  Number(process.env.ACTIVITY_INTERVAL_SECONDS || 15) * 1000,
  5000
);
const REALTIME_INTERVAL_MS = Math.max(
  Number(process.env.REALTIME_INTERVAL_SECONDS || 5) * 1000,
  2000
);

// Feature Flags
const ENHANCED_BROWSER_DETECTION = process.env.ENHANCED_BROWSER_DETECTION !== 'false';
const APPLESCRIPT_ENABLED = process.env.APPLESCRIPT_ENABLED !== 'false';
const REALTIME_ENABLED = process.env.REALTIME_ENABLED !== 'false';
const ENABLE_CONSOLE_LOGS = process.env.ENABLE_CONSOLE_LOGS !== 'false';

// macOS Permissions
const MACOS_ACCESSIBILITY_REQUIRED = process.env.MACOS_ACCESSIBILITY_REQUIRED !== 'false';
const MACOS_SCREEN_RECORDING_REQUIRED = process.env.MACOS_SCREEN_RECORDING_REQUIRED !== 'false';
const MACOS_AUTOMATION_REQUIRED = process.env.MACOS_AUTOMATION_REQUIRED !== 'false';

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

// Real-time monitoring
let websocket = null;
let realtimeTimer = null;
let lastActivityData = null;

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

// Real-time monitoring functions
const connectWebSocket = (token) => {
  if (!REALTIME_ENABLED) {
    if (ENABLE_CONSOLE_LOGS) {
      console.log('📡 Real-time monitoring disabled via environment');
    }
    return;
  }
  
  // Don't connect if no token or token is too short
  if (!token || token.length < 10) {
    if (ENABLE_CONSOLE_LOGS) {
      console.warn('⚠️ Cannot connect to WebSocket: Invalid or missing token');
    }
    return;
  }
  
  if (ENABLE_CONSOLE_LOGS) {
    console.log('🔗 Attempting WebSocket connection with token:', token ? 'Present' : 'Missing');
    console.log('🔗 Token length:', token ? token.length : 0);
    console.log('🔗 Token preview:', token ? token.substring(0, 20) + '...' : 'None');
    console.log('🔗 WebSocket URL:', `${WEBSOCKET_URL}?token=${token}`);
  }
  
  try {
    websocket = new WebSocket(`${WEBSOCKET_URL}?token=${token}`);
    
    websocket.on('open', () => {
      if (ENABLE_CONSOLE_LOGS) {
        console.log('🔗 WebSocket connected for real-time monitoring');
      }
    });
    
    websocket.on('error', (error) => {
      if (ENABLE_CONSOLE_LOGS) {
        console.warn('⚠️ WebSocket error:', error.message);
        console.warn('⚠️ WebSocket error code:', error.code);
        console.warn('⚠️ WebSocket error details:', error);
      }
    });
    
    websocket.on('close', () => {
      if (ENABLE_CONSOLE_LOGS) {
        console.log('🔌 WebSocket disconnected');
      }
    });
    
    websocket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (ENABLE_CONSOLE_LOGS) {
          console.log('📨 WebSocket message received:', message.type);
        }
        
        if (message.type === 'notification') {
          if (ENABLE_CONSOLE_LOGS) {
            console.log('🔔 Notification received via WebSocket:', message.data);
          }
          // Send notification to renderer
          if (mainWindow && !mainWindow.isDestroyed()) {
            if (ENABLE_CONSOLE_LOGS) {
              console.log('📤 Sending notification to renderer:', message.data.title);
            }
            mainWindow.webContents.send('status', {
              type: 'notification',
              data: message.data
            });
          } else {
            if (ENABLE_CONSOLE_LOGS) {
              console.warn('⚠️ Cannot send notification: mainWindow not available');
            }
          }
        } else if (message.type === 'connected') {
          if (ENABLE_CONSOLE_LOGS) {
            console.log('🔗 WebSocket connection confirmed');
          }
          // Send connection status to renderer
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('status', {
              type: 'connected'
            });
          }
        }
      } catch (error) {
        if (ENABLE_CONSOLE_LOGS) {
          console.warn('⚠️ Invalid WebSocket message:', error.message);
        }
      }
    });
  } catch (error) {
    if (ENABLE_CONSOLE_LOGS) {
      console.warn('⚠️ WebSocket connection failed:', error.message);
    }
  }
};

const pushRealtimeData = async (data) => {
  try {
    // Push via WebSocket if connected
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: 'activity_update',
        data: data,
        timestamp: new Date().toISOString()
      }));
    }
    
    // Also push via REST API as fallback
    if (activityContext && activityContext.token) {
      const client = withAuth(activityContext.token);
      await client.post('/realtime/activity', {
        userId: activityContext.userId,
        data: data,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.warn('⚠️ Real-time push failed:', error.message);
  }
};

const startRealtimeMonitoring = (context) => {
  if (realtimeTimer || !REALTIME_ENABLED) return;
  
  realtimeTimer = setInterval(async () => {
    try {
      const [windowInfo, load] = await Promise.all([
        getActiveWindow(),
        si.currentLoad()
      ]);
      
      const idleSeconds = powerMonitor.getSystemIdleTime();
      const currentTime = new Date();
      
      const activityData = {
        userId: context.userId,
        taskId: context.taskId,
        timeLogId: context.timeLogId,
        windowTitle: windowInfo?.title || 'Unknown',
        appName: windowInfo?.owner?.name || 'Unknown',
        url: windowInfo?.url || null,
        idleSeconds,
        keyboardCount,
        mouseCount,
        cpuUsage: load?.currentload ? Number(load.currentload.toFixed(2)) : 0,
        activityScore: Math.max(0, Math.min(1, (15 - idleSeconds) / 15)),
        timestamp: currentTime.toISOString()
      };
      
      // Only push if data has changed significantly
      if (!lastActivityData || 
          lastActivityData.windowTitle !== activityData.windowTitle ||
          lastActivityData.appName !== activityData.appName ||
          Math.abs(lastActivityData.idleSeconds - activityData.idleSeconds) > 5) {
        
        await pushRealtimeData(activityData);
        lastActivityData = activityData;
      }
    } catch (error) {
      if (ENABLE_CONSOLE_LOGS) {
        console.warn('⚠️ Real-time monitoring failed:', error.message);
      }
    }
  }, REALTIME_INTERVAL_MS);
};

const stopRealtimeMonitoring = () => {
  if (realtimeTimer) {
    clearInterval(realtimeTimer);
    realtimeTimer = null;
  }
  
  if (websocket) {
    websocket.close();
    websocket = null;
  }
  
  lastActivityData = null;
};

const stopScreenshotCapture = () => {
  if (captureTimer) {
    clearInterval(captureTimer);
    captureTimer = null;
  }
  captureContext = null;
};

const captureAndUpload = async () => {
  if (!captureContext) return;
  try {
    const buffer = await screenshotDesktop({ format: 'png' });
    const timestamp = new Date();

    const form = new FormData();
    form.append('screenshot', buffer, {
      filename: `capture-${timestamp.getTime()}.png`,
      contentType: 'image/png'
    });
    form.append('capturedAt', timestamp.toISOString());
    if (captureContext.taskId) {
      form.append('taskId', captureContext.taskId);
    }
    if (captureContext.timeLogId) {
      form.append('timeLogId', captureContext.timeLogId);
    }

    const client = withAuth(captureContext.token);
    await client.post('/screenshots', form, { headers: form.getHeaders() });

    sendStatus({ type: 'capture', timestamp: timestamp.toISOString() });
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

// macOS Permissions Check
const checkMacOSPermissions = async () => {
  if (process.platform !== 'darwin') return true;
  
  const permissions = {
    accessibility: false,
    screenRecording: false,
    automation: false
  };
  
  try {
    // Test accessibility permission
    if (MACOS_ACCESSIBILITY_REQUIRED) {
      try {
        const testWindow = await getActiveWindow();
        permissions.accessibility = testWindow && testWindow.title !== 'Unknown Window';
      } catch (error) {
        permissions.accessibility = false;
      }
    }
    
    // Test screen recording permission
    if (MACOS_SCREEN_RECORDING_REQUIRED) {
      try {
        await screenshotDesktop();
        permissions.screenRecording = true;
      } catch (error) {
        permissions.screenRecording = false;
      }
    }
    
    // Test automation permission (AppleScript)
    if (MACOS_AUTOMATION_REQUIRED && APPLESCRIPT_ENABLED) {
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        await execAsync('osascript -e "tell application \\"System Events\\" to get name of first process"');
        permissions.automation = true;
      } catch (error) {
        permissions.automation = false;
      }
    }
    
    return permissions;
  } catch (error) {
    if (ENABLE_CONSOLE_LOGS) {
      console.warn('⚠️ Permission check failed:', error.message);
    }
    return permissions;
  }
};

const getActiveWindow = async () => {
  try {
    if (!activeWinModule) {
      activeWinModule = await import('@produce8/p8-active-win');
    }
    const resolver = activeWinModule.default || activeWinModule;
    const windowInfo = await resolver();
    
    // If we got a valid window, try to enhance it with AppleScript for browsers
    if (windowInfo && windowInfo.owner && windowInfo.owner.name) {
      const appName = windowInfo.owner.name;
      
      // Check if it's a browser we can enhance with AppleScript (exact name matching)
      const supportedBrowsers = ['Google Chrome', 'Brave Browser', 'Microsoft Edge', 'Safari', 'Firefox'];
      if (supportedBrowsers.includes(appName) && ENHANCED_BROWSER_DETECTION && APPLESCRIPT_ENABLED) {
        try {
          const enhancedInfo = await getBrowserTabInfo(appName, windowInfo);
          if (enhancedInfo && enhancedInfo.enhanced) {
            return enhancedInfo;
          }
        } catch (error) {
          if (ENABLE_CONSOLE_LOGS) {
            console.warn('⚠️ AppleScript enhancement failed:', error.message);
          }
        }
      }
    }
    
    return windowInfo;
  } catch (error) {
    if (ENABLE_CONSOLE_LOGS) {
      console.warn('⚠️ @produce8/p8-active-win failed, using fallback detection:', error.message);
    }
    // Fallback: Return basic window info without active-win
    return {
      title: 'Unknown Window',
      owner: { name: 'Unknown App' },
      url: null
    };
  }
};

// Enhanced AppleScript helper to get browser tab information with URL capture
const getBrowserTabInfo = async (appName, baseInfo) => {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    let script = '';
    
    // Enhanced AppleScript for different browsers with URL capture
    switch (appName) {
      case 'Google Chrome':
        script = `
          osascript -e '
          tell application "Google Chrome"
            if (count of windows) > 0 then
              set activeTab to active tab of front window
              set tabTitle to title of activeTab
              set tabUrl to URL of activeTab
              return tabTitle & "||" & tabUrl
            else
              return "No active window||"
            end if
          end tell'
        `;
        break;
        
      case 'Brave Browser':
        script = `
          osascript -e '
          tell application "Brave Browser"
            if (count of windows) > 0 then
              set activeTab to active tab of front window
              set tabTitle to title of activeTab
              set tabUrl to URL of activeTab
              return tabTitle & "||" & tabUrl
            else
              return "No active window||"
            end if
          end tell'
        `;
        break;
        
      case 'Microsoft Edge':
        script = `
          osascript -e '
          tell application "Microsoft Edge"
            if (count of windows) > 0 then
              set activeTab to active tab of front window
              set tabTitle to title of activeTab
              set tabUrl to URL of activeTab
              return tabTitle & "||" & tabUrl
            else
              return "No active window||"
            end if
          end tell'
        `;
        break;
        
      case 'Safari':
        script = `
          osascript -e '
          tell application "Safari"
            if (count of windows) > 0 then
              set activeTab to current tab of front window
              set tabTitle to name of activeTab
              set tabUrl to URL of activeTab
              return tabTitle & "||" & tabUrl
            else
              return "No active window||"
            end if
          end tell'
        `;
        break;
        
      case 'Firefox':
        // Firefox doesn't expose active tab URLs via AppleScript
        script = `
          osascript -e '
          tell application "Firefox"
            if (count of windows) > 0 then
              set tabTitle to name of front window
              return tabTitle & "||"
            else
              return "No active window||"
            end if
          end tell'
        `;
        break;
        
      default:
        return baseInfo;
    }
    
    if (script) {
      const { stdout } = await execAsync(script);
      const result = stdout.trim();
      
      if (result && result !== 'No active window||') {
        const [tabTitle, tabURL] = result.split('||');
        const title = tabTitle?.trim() || baseInfo.title;
        const url = tabURL?.trim() || baseInfo.url;
        
        console.log(`🌐 Enhanced browser tab: ${title} (${url})`);
        
        return {
          ...baseInfo,
          title: title,
          url: url,
          enhanced: true
        };
      }
    }
    
    return baseInfo;
  } catch (error) {
    console.warn('⚠️ AppleScript execution failed:', error.message);
    return baseInfo;
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

// Track previous window state for tab switching detection
let previousWindowState = null;
let windowSwitchCount = 0;
let lastWindowSwitchTime = null;

const captureActivitySample = async () => {
  if (!activityContext) {
    console.log('⚠️ No activity context - stopping activity tracking');
    stopActivityTracking();
    return;
  }
  
  if (!activityContext.taskId || !activityContext.timeLogId) {
    console.log('⚠️ Invalid activity context - missing taskId or timeLogId');
    return;
  }
  
  try {
    const [windowInfo, load] = await Promise.all([getActiveWindow(), si.currentLoad()]);
    const idleSeconds = powerMonitor.getSystemIdleTime();
    const durationSeconds = Math.round(ACTIVITY_INTERVAL_MS / 1000);
    const timestamp = new Date();

    // Enhanced tab switching detection
    const currentWindowState = {
      title: windowInfo?.title || 'Unknown',
      app: windowInfo?.owner?.name || 'Unknown',
      url: windowInfo?.url || null
    };

    // Detect window/tab switches
    const isWindowSwitch = previousWindowState && 
      (previousWindowState.title !== currentWindowState.title || 
       previousWindowState.app !== currentWindowState.app);

    if (isWindowSwitch) {
      windowSwitchCount++;
      lastWindowSwitchTime = timestamp.toISOString();
      console.log(`🔄 Tab/Window Switch Detected: ${previousWindowState.title} → ${currentWindowState.title}`);
    }

    // Enhanced activity scoring with tab switching consideration
    const baseActivityScore = Math.max(0, Math.min(1, (durationSeconds - idleSeconds) / durationSeconds));
    const switchBonus = isWindowSwitch ? 0.1 : 0; // Bonus for active tab switching
    const enhancedActivityScore = Math.min(1, baseActivityScore + switchBonus);

    const payload = {
      capturedAt: timestamp.toISOString(),
      durationSeconds,
      windowTitle: currentWindowState.title,
      appName: currentWindowState.app,
      url: currentWindowState.url,
      idleSeconds,
      activityScore: enhancedActivityScore,
      cpuUsage: load?.currentload ? Number(load.currentload.toFixed(2)) : 0,
      keyboardCount,
      mouseCount,
      keystrokes: keystrokeBuffer.slice(0, 200),
      taskId: activityContext.taskId,
      timeLogId: activityContext.timeLogId,
      // Enhanced tracking data
      isWindowSwitch,
      windowSwitchCount,
      lastWindowSwitchTime
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
      isWindowSwitch,
      windowSwitchCount
    });

    // Update previous window state
    previousWindowState = currentWindowState;

    keyboardCount = 0;
    mouseCount = 0;
    keystrokeBuffer = [];
  } catch (error) {
    console.error('Failed to record activity', error.message);
    sendStatus({ type: 'error', message: error.message });
  }
};

const startActivityTracking = (context) => {
  if (!context || !context.taskId || !context.timeLogId || !context.token) {
    console.error('❌ Invalid activity context provided:', context);
    return;
  }
  
  stopActivityTracking();
  activityContext = context;
  console.log('✅ Starting activity tracking for task:', context.taskId);
  captureActivitySample();
  activityTimer = setInterval(captureActivitySample, ACTIVITY_INTERVAL_MS);
};

const startTracking = (context) => {
  if (!context || !context.taskId || !context.timeLogId || !context.token) {
    console.error('❌ Invalid tracking context provided:', context);
    sendStatus({ type: 'error', message: 'Invalid tracking context' });
    return;
  }
  
  console.log('🚀 Starting tracking for task:', context.taskId);
  startScreenshotCapture(context);
  startActivityTracking(context);
  startInputHooks();
  startRealtimeMonitoring(context);
  
  // Only connect to WebSocket if we have a valid token
  if (context.token && context.token.length > 10) {
    connectWebSocket(context.token);
  } else {
    console.warn('⚠️ Invalid token provided for WebSocket connection');
  }
  
  sendStatus({ type: 'timer', state: 'running' });
};

const stopTracking = () => {
  stopScreenshotCapture();
  stopActivityTracking();
  stopInputHooks();
  stopRealtimeMonitoring();
};

// Resolve the correct tray icon for the current platform/build
const resolveTrayImage = () => {
  const baseDir = app.isPackaged ? process.resourcesPath : path.join(__dirname, '..');
  const buildDir = path.join(baseDir, 'build');
  const candidates = process.platform === 'darwin'
    ? ['iconTemplate.png', 'icon.png', 'iconTemplate@2x.png', 'icon.ico']
    : ['icon.ico', 'icon.png'];

  for (const fileName of candidates) {
    const candidatePath = path.join(buildDir, fileName);

    if (!fs.existsSync(candidatePath)) {
      continue;
    }

    let image = nativeImage.createFromPath(candidatePath);

    if (image.isEmpty()) {
      if (ENABLE_CONSOLE_LOGS) {
        console.warn('⚠️ Tray icon candidate is empty:', candidatePath);
      }
      continue;
    }

    if (process.platform === 'darwin') {
      image = image.resize({ width: 18, height: 18, quality: 'best' });
      image.setTemplateImage(true);
    }

    return { image, path: candidatePath };
  }

  return null;
};

const createTray = () => {
  const resolvedIcon = resolveTrayImage();

  if (!resolvedIcon) {
    console.error('❌ Failed to locate a tray icon asset.');
    return;
  }

  try {
    tray = new Tray(resolvedIcon.image);
    if (ENABLE_CONSOLE_LOGS) {
      console.log('✅ System tray icon loaded from:', resolvedIcon.path);
    }
  } catch (error) {
    console.error('❌ Failed to create system tray:', error.message);
    tray = null;
    return;
  }
  
  // Only create menu if tray was successfully created
  if (!tray) {
    console.log('⚠️ Skipping tray menu creation - tray not available');
    return;
  }
  
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
      label: 'Hide',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
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
  tray.setToolTip('WebWork Tracker - Time Tracking');
  
  // Show window when tray icon is clicked
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
  
  console.log('✅ System tray created');
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 640,
    minWidth: 360,
    minHeight: 500,
    maxWidth: 1200,
    maxHeight: 800,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closable: true,
    title: 'WebWork Tracker',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      // Enable location services
      webSecurity: false,
      // Allow geolocation
      partition: 'persist:webwork-tracker'
    }
  });

  // Handle window close - minimize to tray instead of quitting
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.removeMenu();
  
  // Handle permission requests
  const allowedPermissions = new Set(['geolocation', 'notifications']);

  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
    console.log('🔐 Permission requested:', permission);
    if (allowedPermissions.has(permission)) {
      console.log(`✅ Allowing ${permission} permission`);
      callback(true);
      return;
    }

    callback(false);
  });
  
  // Set permission check handler
  mainWindow.webContents.session.setPermissionCheckHandler((_webContents, permission) => {
    console.log('🔍 Permission check:', permission);
    if (allowedPermissions.has(permission)) {
      console.log(`✅ ${permission.charAt(0).toUpperCase() + permission.slice(1)} permission granted`);
      return true;
    }
    return false;
  });
  
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
};

// Initialize app when ready
app.whenReady().then(async () => {
  // Check macOS permissions on startup
  if (process.platform === 'darwin') {
    const permissions = await checkMacOSPermissions();
    
    if (ENABLE_CONSOLE_LOGS) {
      console.log('🔐 macOS Permissions Status:');
      console.log(`  Accessibility: ${permissions.accessibility ? '✅' : '❌'}`);
      console.log(`  Screen Recording: ${permissions.screenRecording ? '✅' : '❌'}`);
      console.log(`  Automation: ${permissions.automation ? '✅' : '❌'}`);
      
      if (!permissions.accessibility && MACOS_ACCESSIBILITY_REQUIRED) {
        console.warn('⚠️ Accessibility permission required for window detection');
      }
      if (!permissions.screenRecording && MACOS_SCREEN_RECORDING_REQUIRED) {
        console.warn('⚠️ Screen Recording permission required for screenshots');
      }
      if (!permissions.automation && MACOS_AUTOMATION_REQUIRED) {
        console.warn('⚠️ Automation permission required for enhanced browser detection');
      }
    }
  }
  
  createTray();
  createWindow();
  
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
  // Don't quit the app - keep it running in the system tray
  // The app will only quit when explicitly requested from the tray menu
});

app.on('before-quit', () => {
  app.isQuiting = true;
});

ipcMain.handle('auth:login', async (_event, credentials) => {
  const { data } = await api.post('/auth/login', credentials);
  return data.data;
});

// GPS data handler with retry logic
ipcMain.handle('gps:sendData', async (_event, gpsData, retryCount = 0) => {
  try {
    if (ENABLE_CONSOLE_LOGS) {
      console.log('📍 GPS data received:', gpsData.latitude, gpsData.longitude);
    }

    // Validate GPS data
    if (!gpsData.latitude || !gpsData.longitude) {
      throw new Error('Invalid GPS data: missing coordinates');
    }

    const token = gpsData.token || activityContext?.token;
    if (!token) {
      throw new Error('No authentication token available');
    }

    // Send GPS data to backend
    const response = await api.post('/gps/points', {
      points: [gpsData],
      sessionId: gpsData.sessionId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    if (ENABLE_CONSOLE_LOGS) {
      console.log('✅ GPS data sent to backend');
    }

    return { success: true };
  } catch (error) {
    console.error('⚠️ Failed to send GPS data:', error.message);
    
    // Retry logic for network errors
    if (retryCount < 3 && (
      error.code === 'ECONNREFUSED' || 
      error.code === 'ENOTFOUND' || 
      error.code === 'ETIMEDOUT' ||
      error.response?.status >= 500
    )) {
      console.log(`🔄 Retrying GPS data send (attempt ${retryCount + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
      return ipcMain.handle('gps:sendData', _event, gpsData, retryCount + 1);
    }

    // Handle specific error types
    if (error.response?.status === 401) {
      console.error('🔐 Authentication failed - GPS data not sent');
      return { success: false, error: 'Authentication failed', requiresReauth: true };
    } else if (error.response?.status === 403) {
      console.error('🚫 Access denied - GPS data not sent');
      return { success: false, error: 'Access denied' };
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🌐 Backend server not available');
      return { success: false, error: 'Backend server not available' };
    }

    return { success: false, error: error.message };
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

ipcMain.on('tracker:logout', () => {
  stopTracking();
  sendStatus({ type: 'timer', state: 'idle' });
});

app.on('before-quit', () => {
  stopTracking();
});
