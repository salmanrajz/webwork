const { app, BrowserWindow, ipcMain, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const screenshotDesktop = require('screenshot-desktop');
const dotenv = require('dotenv');
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

const silenceLogs =
  app.isPackaged && (process.env.WEBWORK_SILENCE_LOGS || '').toLowerCase() !== 'false';

if (silenceLogs) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  app.commandLine.appendSwitch('disable-logging');
}

const developmentEnvPath = path.join(__dirname, '..', '.env');
const productionEnvPath = path.join(process.resourcesPath, '.env');
if (!process.env.API_BASE_URL) {
  if (app.isPackaged && fs.existsSync(productionEnvPath)) {
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

let mainWindow = null;
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

const captureActivitySample = async () => {
  if (!activityContext) return;
  try {
    const [windowInfo, load] = await Promise.all([getActiveWindow(), si.currentLoad()]);
    const idleSeconds = powerMonitor.getSystemIdleTime();
    const durationSeconds = Math.round(ACTIVITY_INTERVAL_MS / 1000);
    const timestamp = new Date();

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
      timeLogId: activityContext.timeLogId
    };

    const client = withAuth(activityContext.token);
    await client.post('/activities', { activities: [payload] });

    sendStatus({
      type: 'activity',
      timestamp: timestamp.toISOString(),
      windowTitle: payload.windowTitle,
      appName: payload.appName,
      idleSeconds,
      cpuUsage: payload.cpuUsage,
      keyboardCount: payload.keyboardCount,
      mouseCount: payload.mouseCount
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

const startTracking = (context) => {
  startScreenshotCapture(context);
  startActivityTracking(context);
  startInputHooks();
  sendStatus({ type: 'timer', state: 'running' });
};

const stopTracking = () => {
  stopScreenshotCapture();
  stopActivityTracking();
  stopInputHooks();
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 640,
    resizable: false,
    title: 'WebWork Tracker',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
};

app.whenReady().then(() => {
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
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('auth:login', async (_event, credentials) => {
  const { data } = await api.post('/auth/login', credentials);
  return data.data;
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

app.on('before-quit', () => {
  stopTracking();
});
