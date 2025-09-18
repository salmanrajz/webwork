const authSection = document.getElementById('auth');
const trackerSection = document.getElementById('tracker');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authError = document.getElementById('auth-error');
const taskSelect = document.getElementById('task-select');
const userName = document.getElementById('user-name');
const userRole = document.getElementById('user-role');
const logoutButton = document.getElementById('logout');
const statusLabel = document.getElementById('status');
const statusNote = document.getElementById('status-note');
const tabSwitchIndicator = document.getElementById('tab-switch-indicator');
const switchCount = document.getElementById('switch-count');
const lastSwitch = document.getElementById('last-switch');
const timerDisplay = document.getElementById('timer-display');
const elapsedTime = document.getElementById('elapsed-time');
const attendanceState = document.getElementById('attendance-state');
const attendanceNote = document.getElementById('attendance-note');
const clockToggleBtn = document.getElementById('clock-toggle');

// Modal elements
const analyticsBtn = document.getElementById('analytics-btn');
const productivityBtn = document.getElementById('productivity-btn');
const settingsBtn = document.getElementById('settings-btn');
const themeToggle = document.getElementById('theme-toggle');
const analyticsModal = document.getElementById('analytics-modal');
const productivityModal = document.getElementById('productivity-modal');
const breakSettingsModal = document.getElementById('break-settings-modal');
const closeAnalytics = document.getElementById('close-analytics');
const closeProductivity = document.getElementById('close-productivity');
const closeSettings = document.getElementById('close-settings');
const saveSettings = document.getElementById('save-settings');
const cancelSettings = document.getElementById('cancel-settings');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resumeBtn = document.getElementById('resume');
const stopBtn = document.getElementById('stop');
const eventLog = document.getElementById('event-log');

const state = {
  token: null,
  user: null,
  activeLog: null,
  tasks: [],
  attendance: null,
  theme: localStorage.getItem('webwork_theme') || 'light',
  breakSettings: {
    enabled: true,
    interval: 60,
    dailyTarget: 8
  },
  notifications: [],
  isConnected: false,
  gps: {
    enabled: false,
    permission: 'prompt', // 'granted', 'denied', 'prompt'
    lastLocation: null,
    watchId: null,
    isTracking: false
  }
};

const setStatus = (text, note = '') => {
  statusLabel.textContent = text;
  statusNote.textContent = note;
};

// Notification handling functions
const addNotification = (notification) => {
  state.notifications.unshift(notification);
  // Keep only last 50 notifications
  if (state.notifications.length > 50) {
    state.notifications = state.notifications.slice(0, 50);
  }
  updateNotificationDisplay();
  
  // Show browser notification if permission granted
  if (Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '../build/icon.ico',
      tag: notification.id
    });
  }
};

const updateNotificationDisplay = () => {
  // Update notification count in UI if element exists
  const notificationCount = document.getElementById('notification-count');
  if (notificationCount) {
    notificationCount.textContent = state.notifications.length;
    notificationCount.style.display = state.notifications.length > 0 ? 'block' : 'none';
  }
  
  // Update notifications list
  const notificationsList = document.getElementById('notifications-list');
  if (notificationsList) {
    if (state.notifications.length === 0) {
      notificationsList.innerHTML = '<p class="no-notifications">No notifications yet</p>';
    } else {
      notificationsList.innerHTML = state.notifications.map(notification => `
        <div class="notification-item">
          <div class="notification-header">
            <span class="notification-icon">${getNotificationIcon(notification.type)}</span>
            <h4 class="notification-title">${notification.title}</h4>
          </div>
          <p class="notification-message">${notification.message}</p>
          <div class="notification-meta">
            <span class="notification-priority ${notification.priority}">${notification.priority}</span>
            <span>${new Date(notification.timestamp).toLocaleString()}</span>
          </div>
        </div>
      `).join('');
    }
  }
};

const getNotificationIcon = (type) => {
  const icons = {
    info: 'ℹ️',
    task: '📋',
    reminder: '⏰',
    system: '🔧',
    warning: '⚠️',
    success: '✅'
  };
  return icons[type] || '📢';
};

const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return Notification.permission === 'granted';
};

const isProduction = false; // Always show logs in development

const logEvent = (message) => {
  if (isProduction) return;
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  const timeEl = document.createElement('time');
  timeEl.textContent = new Date().toLocaleTimeString();
  entry.appendChild(timeEl);
  entry.appendChild(document.createTextNode(` ${message}`));
  eventLog.prepend(entry);
};

const toggleTracker = (show) => {
  if (show) {
    authSection.classList.add('hidden');
    trackerSection.classList.remove('hidden');
  } else {
    trackerSection.classList.add('hidden');
    authSection.classList.remove('hidden');
  }
};

const setButtonsState = ({ running }) => {
  const hasTask = state.tasks.length > 0;
  startBtn.disabled = running || !hasTask;
  resumeBtn.disabled = running || !hasTask;
  pauseBtn.disabled = !running;
  stopBtn.disabled = !running;
};

const setAttendanceDisplay = () => {
  if (state.attendance) {
    attendanceState.textContent = 'Clocked in';
    attendanceNote.textContent = new Date(state.attendance.clockIn).toLocaleTimeString();
    clockToggleBtn.textContent = 'Clock Out';
    clockToggleBtn.classList.remove('primary');
    clockToggleBtn.classList.add('danger');
  } else {
    attendanceState.textContent = 'Not clocked in';
    attendanceNote.textContent = 'Start your shift when ready.';
    clockToggleBtn.textContent = 'Clock In';
    clockToggleBtn.classList.remove('danger');
    clockToggleBtn.classList.add('secondary');
  }
};

const populateTasks = () => {
  taskSelect.innerHTML = '';
  if (state.tasks.length === 0) {
    const placeholder = document.createElement('option');
    placeholder.textContent = 'No tasks assigned';
    placeholder.disabled = true;
    placeholder.selected = true;
    taskSelect.appendChild(placeholder);
    setButtonsState({ running: false });
    return;
  }
  state.tasks.forEach((task) => {
    const option = document.createElement('option');
    option.value = task.id;
    option.textContent = `${task.title} (${task.project?.name ?? 'Project'})`;
    taskSelect.appendChild(option);
  });
  setButtonsState({ running: false });
};

const refreshTasks = async () => {
  if (!state.token || !state.user) return;
  try {
    const response = await window.desktop.listTasks({
      token: state.token,
      assigneeId: state.user.id
    });
    state.tasks = response;
    populateTasks();
  } catch (error) {
    logEvent('Failed to load tasks');
  }
};

const loadActiveLog = async () => {
  if (!state.token) return;
  const active = await window.desktop.getActiveLog({ token: state.token });
  state.activeLog = active;
  if (active) {
    setStatus('Running', 'Timer started at ' + new Date(active.startTime).toLocaleTimeString());
    setButtonsState({ running: true });
  } else {
    setStatus('Idle', 'Start a task to begin tracking.');
    setButtonsState({ running: false });
  }
};

const loadAttendance = async () => {
  if (!state.token) return;
  try {
    const record = await window.desktop.getActiveAttendance({ token: state.token });
    state.attendance = record;
  } catch (error) {
    console.error('Failed to load attendance', error);
    state.attendance = null;
  }
  setAttendanceDisplay();
};

const ensureClockedIn = async () => {
  if (state.attendance || !state.token) return;
  try {
    const record = await window.desktop.clockIn({ token: state.token });
    state.attendance = record;
    setAttendanceDisplay();
    logEvent('Clocked in automatically.');
  } catch (error) {
    logEvent('Unable to clock in automatically.');
  }
};

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  authError.classList.add('hidden');
  try {
    const credentials = {
      email: emailInput.value,
      password: passwordInput.value
    };
    const data = await window.desktop.login(credentials);
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('webwork_tracker_token', state.token);
    localStorage.setItem('webwork_tracker_user', JSON.stringify(state.user));
    userName.textContent = `${state.user.firstName} ${state.user.lastName}`;
    userRole.textContent = state.user.role.toUpperCase();
    toggleTracker(true);
    await refreshTasks();
    await loadActiveLog();
    await loadAttendance();
    logEvent('Signed in successfully.');
  } catch (error) {
    console.error(error);
    authError.textContent = error?.response?.data?.message || 'Unable to sign in.';
    authError.classList.remove('hidden');
  }
});

logoutButton.addEventListener('click', async () => {
  if (state.token && state.attendance) {
    try {
      await window.desktop.clockOut({ token: state.token });
      logEvent('Clocked out.');
    } catch (error) {
      console.error('Failed to clock out on logout', error);
    }
  }
  state.token = null;
  state.user = null;
  state.activeLog = null;
  state.attendance = null;
  localStorage.removeItem('webwork_tracker_token');
  localStorage.removeItem('webwork_tracker_user');
  window.desktop.logout();
  toggleTracker(false);
  setStatus('Idle', '');
  setButtonsState({ running: false });
  setAttendanceDisplay();
});

clockToggleBtn.addEventListener('click', async () => {
  if (!state.token) return;
  try {
    if (state.attendance) {
      const record = await window.desktop.clockOut({ token: state.token });
      state.attendance = null;
      setAttendanceDisplay();
      logEvent('Clocked out at ' + new Date(record.clockOut).toLocaleTimeString());
      
      // Show push notification when clocking out
      if (Notification.permission === 'granted') {
        new Notification('WebWork Tracker - Clocked Out', {
          body: `Clocked out at ${new Date(record.clockOut).toLocaleTimeString()}`,
          icon: '../build/icon.ico',
          tag: 'clock-out'
        });
      }
    } else {
      const record = await window.desktop.clockIn({ token: state.token });
      state.attendance = record;
      setAttendanceDisplay();
      logEvent('Clocked in at ' + new Date(record.clockIn).toLocaleTimeString());
      
      // Show push notification when clocking in
      if (Notification.permission === 'granted') {
        new Notification('WebWork Tracker - Clocked In', {
          body: `Clocked in at ${new Date(record.clockIn).toLocaleTimeString()}`,
          icon: '../build/icon.ico',
          tag: 'clock-in'
        });
      }
    }
  } catch (error) {
    logEvent('Attendance update failed: ' + (error?.response?.data?.message || error.message));
  }
});

startBtn.addEventListener('click', async () => {
  if (!state.token || !taskSelect.value) return;
  try {
    await ensureClockedIn();
    const log = await window.desktop.startTimer({ token: state.token, taskId: taskSelect.value });
    state.activeLog = log;
    setStatus('Running', 'Tracking started.');
    setButtonsState({ running: true });
    logEvent(`Started timer for task ${taskSelect.selectedOptions[0].text}`);

    // 🔍 TEST: GPS Debug Start
    console.log('🔍 GPS DEBUG: Timer started, checking GPS...');
    logEvent('🔍 GPS DEBUG: Timer started, checking GPS...');

    // Start GPS tracking if permission is granted
    logEvent(`GPS permission status: ${state.gps.permission}`);
    if (state.gps.permission === 'granted') {
      logEvent('GPS permission already granted, starting tracking');
      startGpsTracking();
    } else if (state.gps.permission === 'prompt') {
      logEvent('Requesting GPS permission...');
      const granted = await requestGpsPermission();
      if (granted) {
        logEvent('GPS permission granted, starting tracking');
        startGpsTracking();
      } else {
        logEvent('GPS permission denied');
      }
    } else {
      logEvent('GPS permission denied, cannot start tracking');
    }

    // Show push notification when starting tracking
    if (Notification.permission === 'granted') {
      new Notification('WebWork Tracker Started', {
        body: `Started tracking task: ${taskSelect.selectedOptions[0].text}`,
        icon: '../build/icon.ico',
        tag: 'tracker-start'
      });
    }
  } catch (error) {
    logEvent('Failed to start timer: ' + (error?.response?.data?.message || error.message));
  }
});

pauseBtn.addEventListener('click', async () => {
  if (!state.token) return;
  try {
    await window.desktop.pauseTimer({ token: state.token });
    setStatus('Paused', 'Timer paused.');
    setButtonsState({ running: false });
    logEvent('Timer paused.');

    // Stop GPS tracking when pausing
    stopGpsTracking();

    // Show push notification when pausing
    if (Notification.permission === 'granted') {
      new Notification('WebWork Tracker Paused', {
        body: 'Timer has been paused',
        icon: '../build/icon.ico',
        tag: 'tracker-pause'
      });
    }
  } catch (error) {
    logEvent('Failed to pause timer: ' + (error?.response?.data?.message || error.message));
  }
});

resumeBtn.addEventListener('click', async () => {
  if (!state.token || !taskSelect.value) return;
  try {
    await ensureClockedIn();
    const log = await window.desktop.resumeTimer({ token: state.token, taskId: taskSelect.value });
    state.activeLog = log;
    setStatus('Running', 'Timer resumed.');
    setButtonsState({ running: true });
    logEvent('Timer resumed.');

    // Resume GPS tracking if permission is granted
    if (state.gps.permission === 'granted') {
      startGpsTracking();
    }

    // Show push notification when resuming
    if (Notification.permission === 'granted') {
      new Notification('WebWork Tracker Resumed', {
        body: 'Timer has been resumed',
        icon: '../build/icon.ico',
        tag: 'tracker-resume'
      });
    }
  } catch (error) {
    logEvent('Failed to resume timer: ' + (error?.response?.data?.message || error.message));
  }
});

stopBtn.addEventListener('click', async () => {
  if (!state.token) return;
  try {
    await window.desktop.stopTimer({ token: state.token });
    state.activeLog = null;
    setStatus('Idle', 'Timer stopped.');
    setButtonsState({ running: false });
    logEvent('Timer stopped.');

    // Stop GPS tracking when stopping
    stopGpsTracking();

    // Show push notification when stopping
    if (Notification.permission === 'granted') {
      new Notification('WebWork Tracker Stopped', {
        body: 'Timer has been stopped',
        icon: '../build/icon.ico',
        tag: 'tracker-stop'
      });
    }
  } catch (error) {
    logEvent('Failed to stop timer: ' + (error?.response?.data?.message || error.message));
  }
});

window.desktop.onStatus((payload) => {
  if (payload.type === 'capture') {
    logEvent('Screenshot captured at ' + new Date(payload.timestamp).toLocaleTimeString());
  }
  if (payload.type === 'timer') {
    if (payload.state === 'running') {
      setStatus('Running', 'Tracker active.');
      setButtonsState({ running: true });
    }
    if (payload.state === 'paused') {
      setStatus('Paused', 'Tracker paused.');
      setButtonsState({ running: false });
    }
    if (payload.state === 'stopped' || payload.state === 'idle') {
      setStatus('Idle', '');
      setButtonsState({ running: false });
    }
  }
  if (payload.type === 'activity') {
    let activityText = `Activity: ${payload.windowTitle || 'unknown window'}`;
    
    // Add URL if available
    if (payload.url) {
      activityText += ` (${payload.url})`;
    }
    
    // Add tab switching indicator
    if (payload.isWindowSwitch) {
      activityText += ` 🔄 SWITCH`;
    }
    
    // Add activity metrics
    if (payload.idleSeconds) {
      activityText += ` • idle ${payload.idleSeconds}s`;
    }
    if (payload.keyboardCount !== undefined) {
      activityText += ` • keys ${payload.keyboardCount}`;
    }
    if (payload.mouseCount !== undefined) {
      activityText += ` • mouse ${payload.mouseCount}`;
    }
    
    // Add switch count if available
    if (payload.windowSwitchCount !== undefined) {
      activityText += ` • switches ${payload.windowSwitchCount}`;
    }
    
    logEvent(activityText);
    
    // Update tab switching indicator
    if (payload.windowSwitchCount !== undefined) {
      tabSwitchIndicator.classList.remove('hidden');
      switchCount.textContent = `${payload.windowSwitchCount} switches`;
      
      if (payload.isWindowSwitch) {
        lastSwitch.textContent = `Last switch: ${new Date().toLocaleTimeString()}`;
      }
    }
  }
  if (payload.type === 'error') {
    logEvent('Error: ' + payload.message);
  }
});

const restoreSession = async () => {
  const token = localStorage.getItem('webwork_tracker_token');
  const user = localStorage.getItem('webwork_tracker_user');
  if (!token || !user) return;
  try {
    state.token = token;
    state.user = JSON.parse(user);
    userName.textContent = `${state.user.firstName} ${state.user.lastName}`;
    userRole.textContent = state.user.role.toUpperCase();
    toggleTracker(true);
    await refreshTasks();
    await loadActiveLog();
    await loadAttendance();
    logEvent('Session restored.');
  } catch (error) {
    console.error('Failed to restore session', error);
    localStorage.clear();
  }
};

// Theme management
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  const themeIcon = document.querySelector('.theme-icon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  localStorage.setItem('webwork_theme', theme);
  state.theme = theme;
};

// Timer display
let timerInterval = null;
const startTimer = () => {
  if (timerInterval) return;
  const startTime = new Date();
  timerDisplay.classList.remove('hidden');
  
  timerInterval = setInterval(() => {
    const now = new Date();
    const elapsed = now - startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    elapsedTime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerDisplay.classList.add('hidden');
  elapsedTime.textContent = '00:00:00';
};

// Attendance management

// Modal management
const showModal = (modal) => {
  modal.classList.remove('hidden');
};

const hideModal = (modal) => {
  modal.classList.add('hidden');
};

// Event handlers
themeToggle.addEventListener('click', () => {
  const newTheme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
});

analyticsBtn.addEventListener('click', () => {
  showModal(analyticsModal);
});

productivityBtn.addEventListener('click', () => {
  showModal(productivityModal);
});

settingsBtn.addEventListener('click', () => {
  showModal(breakSettingsModal);
});

closeAnalytics.addEventListener('click', () => {
  hideModal(analyticsModal);
});

closeProductivity.addEventListener('click', () => {
  hideModal(productivityModal);
});

closeSettings.addEventListener('click', () => {
  hideModal(breakSettingsModal);
});

cancelSettings.addEventListener('click', () => {
  hideModal(breakSettingsModal);
});

saveSettings.addEventListener('click', () => {
  const enabled = document.getElementById('break-enabled').checked;
  const interval = parseInt(document.getElementById('break-interval').value);
  const dailyTarget = parseFloat(document.getElementById('daily-target').value);
  
  state.breakSettings = { enabled, interval, dailyTarget };
  localStorage.setItem('webwork_break_settings', JSON.stringify(state.breakSettings));
  hideModal(breakSettingsModal);
  logEvent('Break settings saved.');
});

// Enhanced status handling
window.desktop.onStatus((payload) => {
  if (payload.type === 'capture') {
    logEvent('Screenshot captured at ' + new Date(payload.timestamp).toLocaleTimeString());
  }
  if (payload.type === 'timer') {
    if (payload.state === 'running') {
      setStatus('Running', 'Tracker active.');
      setButtonsState({ running: true });
      startTimer();
    }
    if (payload.state === 'paused') {
      setStatus('Paused', 'Tracker paused.');
      setButtonsState({ running: false });
      stopTimer();
    }
    if (payload.state === 'stopped' || payload.state === 'idle') {
      setStatus('Idle', '');
      setButtonsState({ running: false });
      stopTimer();
    }
  }
  if (payload.type === 'activity') {
    let activityText = `Activity: ${payload.windowTitle || 'unknown window'}`;
    
    // Add URL if available
    if (payload.url) {
      activityText += ` (${payload.url})`;
    }
    
    // Add tab switching indicator
    if (payload.isWindowSwitch) {
      activityText += ` 🔄 SWITCH`;
    }
    
    // Add activity metrics
    if (payload.idleSeconds) {
      activityText += ` • idle ${payload.idleSeconds}s`;
    }
    if (payload.keyboardCount !== undefined) {
      activityText += ` • keys ${payload.keyboardCount}`;
    }
    if (payload.mouseCount !== undefined) {
      activityText += ` • mouse ${payload.mouseCount}`;
    }
    
    // Add switch count if available
    if (payload.windowSwitchCount !== undefined) {
      activityText += ` • switches ${payload.windowSwitchCount}`;
    }
    
    logEvent(activityText);
    
    // Update tab switching indicator
    if (payload.windowSwitchCount !== undefined) {
      tabSwitchIndicator.classList.remove('hidden');
      switchCount.textContent = `${payload.windowSwitchCount} switches`;
      
      if (payload.isWindowSwitch) {
        lastSwitch.textContent = `Last switch: ${new Date().toLocaleTimeString()}`;
      }
    }
  }
  if (payload.type === 'error') {
    logEvent('Error: ' + payload.message);
  }
});

// Add notification handling to the onStatus handler
window.desktop.onStatus((payload) => {
  console.log('📨 Renderer received payload:', payload.type);
  if (payload.type === 'notification') {
    console.log('🔔 Adding notification to UI:', payload.data.title);
    addNotification(payload.data);
  }
  if (payload.type === 'connected') {
    state.isConnected = true;
    logEvent('WebSocket connected for real-time monitoring');
  }
});

// Session restoration

// Initialize
setButtonsState({ running: false });
applyTheme(state.theme);
restoreSession();

// Request notification permission on startup
requestNotificationPermission();

// GPS Functions
const checkGpsPermission = () => {
  if (!navigator.geolocation) {
    state.gps.permission = 'denied';
    return false;
  }
  return true;
};

const requestGpsPermission = async () => {
  logEvent('Checking GPS support...');
  if (!checkGpsPermission()) {
    logEvent('GPS not supported on this device');
    return false;
  }

  logEvent('Requesting location permission...');
  
  // First check if permission is already granted
  if (navigator.permissions) {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      logEvent(`GPS permission state: ${permission.state}`);
      
      if (permission.state === 'denied') {
        state.gps.permission = 'denied';
        logEvent('GPS permission denied by user');
        return false;
      }
    } catch (permError) {
      logEvent(`Permission check failed: ${permError.message}`);
    }
  }
  
  try {
    logEvent('Attempting to get location...');
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false, // Try less accurate first
        timeout: 15000,
        maximumAge: 300000 // Allow cached location up to 5 minutes
      });
    });
    
    logEvent(`Location obtained: ${position.coords.latitude}, ${position.coords.longitude}`);

    state.gps.permission = 'granted';
    state.gps.lastLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date().toISOString()
    };

    logEvent(`GPS permission granted - Location: ${position.coords.latitude}, ${position.coords.longitude}`);
    return true;
  } catch (error) {
    logEvent(`First location attempt failed: ${error.message}`);
    console.error('GPS Error:', error);
    
    // Try fallback with different settings
    try {
      logEvent('Trying fallback location method...');
      const fallbackPosition = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000 // Allow cached location up to 10 minutes
        });
      });
      
      logEvent(`Fallback location obtained: ${fallbackPosition.coords.latitude}, ${fallbackPosition.coords.longitude}`);
      
      state.gps.permission = 'granted';
      state.gps.lastLocation = {
        latitude: fallbackPosition.coords.latitude,
        longitude: fallbackPosition.coords.longitude,
        accuracy: fallbackPosition.coords.accuracy,
        timestamp: new Date().toISOString()
      };

      logEvent(`GPS permission granted via fallback - Location: ${fallbackPosition.coords.latitude}, ${fallbackPosition.coords.longitude}`);
      return true;
      
    } catch (fallbackError) {
      state.gps.permission = 'denied';
      logEvent(`GPS permission denied: ${fallbackError.message}`);
      console.error('GPS Fallback Error:', fallbackError);
      
      // Try to provide more helpful error messages
      if (fallbackError.code === 1) {
        logEvent('GPS Error: Permission denied by user');
      } else if (fallbackError.code === 2) {
        logEvent('GPS Error: Position unavailable - Check if location services are enabled');
      } else if (fallbackError.code === 3) {
        logEvent('GPS Error: Request timeout - Location services may be slow');
      }
      
      return false;
    }
  }
};

const startGpsTracking = () => {
  logEvent('Starting GPS tracking...');
  if (state.gps.permission !== 'granted') {
    logEvent('GPS permission not granted');
    return;
  }

  if (state.gps.watchId) {
    logEvent('GPS tracking already active');
    return;
  }

  state.gps.isTracking = true;
  logEvent('Setting up GPS watchPosition...');
  state.gps.watchId = navigator.geolocation.watchPosition(
    (position) => {
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
        heading: position.coords.heading,
        altitude: position.coords.altitude,
        timestamp: new Date().toISOString()
      };

      state.gps.lastLocation = location;
      
      logEvent(`GPS position received: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
      
      // Send GPS data to main process
      if (window.desktop && window.desktop.sendGpsData) {
        logEvent('Sending GPS data to main process...');
        window.desktop.sendGpsData({
          ...location,
          sessionId: state.activeLog?.id,
          userId: state.user?.id,
          source: 'desktop',
          clientOs: navigator.platform,
          clientApp: 'desktop',
          token: state.token
        });
      } else {
        logEvent('ERROR: window.desktop.sendGpsData not available');
      }

      logEvent(`GPS: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (${Math.round(location.accuracy)}m)`);
    },
    (error) => {
      logEvent(`GPS error: ${error.message}`);
    },
    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 30000
    }
  );

  logEvent('GPS tracking started');
};

const stopGpsTracking = () => {
  if (state.gps.watchId) {
    navigator.geolocation.clearWatch(state.gps.watchId);
    state.gps.watchId = null;
    state.gps.isTracking = false;
    logEvent('GPS tracking stopped');
  }
};

const getGpsStatus = () => {
  return {
    enabled: state.gps.enabled,
    permission: state.gps.permission,
    isTracking: state.gps.isTracking,
    lastLocation: state.gps.lastLocation
  };
};

// Initialize GPS on app start
checkGpsPermission();

// Notification modal event handlers
const notificationBtn = document.getElementById('notification-btn');
const notificationsModal = document.getElementById('notifications-modal');
const closeNotifications = document.getElementById('close-notifications');

if (notificationBtn) {
  notificationBtn.addEventListener('click', () => {
    notificationsModal.classList.remove('hidden');
    updateNotificationDisplay();
  });
}

if (closeNotifications) {
  closeNotifications.addEventListener('click', () => {
    notificationsModal.classList.add('hidden');
  });
}

// Close modal when clicking outside
if (notificationsModal) {
  notificationsModal.addEventListener('click', (e) => {
    if (e.target === notificationsModal) {
      notificationsModal.classList.add('hidden');
    }
  });
}
