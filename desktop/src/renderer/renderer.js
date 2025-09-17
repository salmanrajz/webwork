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
const attendanceState = document.getElementById('attendance-state');
const attendanceNote = document.getElementById('attendance-note');
const clockToggleBtn = document.getElementById('clock-toggle');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resumeBtn = document.getElementById('resume');
const stopBtn = document.getElementById('stop');
const eventLog = document.getElementById('event-log');
const themeToggle = document.getElementById('theme-toggle');
const timerDisplay = document.getElementById('timer-display');
const elapsedTime = document.getElementById('elapsed-time');

const state = {
  token: null,
  user: null,
  activeLog: null,
  tasks: [],
  attendance: null,
  isDarkMode: localStorage.getItem('webwork_dark_mode') === 'true',
  timerInterval: null,
  startTime: null
};

const setStatus = (text, note = '') => {
  statusLabel.textContent = text;
  statusNote.textContent = note;
};

const toggleDarkMode = () => {
  state.isDarkMode = !state.isDarkMode;
  localStorage.setItem('webwork_dark_mode', state.isDarkMode);
  document.documentElement.setAttribute('data-theme', state.isDarkMode ? 'dark' : 'light');
  themeToggle.querySelector('.theme-icon').textContent = state.isDarkMode ? '☀️' : '🌙';
};

const startTimer = () => {
  if (state.timerInterval) return;
  state.startTime = new Date();
  state.timerInterval = setInterval(updateElapsedTime, 1000);
  timerDisplay.classList.remove('hidden');
  updateElapsedTime();
};

const stopTimer = () => {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  timerDisplay.classList.add('hidden');
  state.startTime = null;
};

const updateElapsedTime = () => {
  if (!state.startTime) return;
  const now = new Date();
  const elapsed = Math.floor((now - state.startTime) / 1000);
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  elapsedTime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const shouldShowLog = window.desktopConfig.shouldShowLog;

const logEvent = (message) => {
  if (!shouldShowLog) return;
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

const setButtonsState = ({ running, loading = false }) => {
  const hasTask = state.tasks.length > 0;
  startBtn.disabled = running || !hasTask || loading;
  resumeBtn.disabled = running || !hasTask || loading;
  pauseBtn.disabled = !running || loading;
  stopBtn.disabled = !running || loading;
  
  // Add loading states
  if (loading) {
    startBtn.classList.add('loading');
    resumeBtn.classList.add('loading');
    pauseBtn.classList.add('loading');
    stopBtn.classList.add('loading');
  } else {
    startBtn.classList.remove('loading');
    resumeBtn.classList.remove('loading');
    pauseBtn.classList.remove('loading');
    stopBtn.classList.remove('loading');
  }
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
    const message =
      error?.response?.data?.message ||
      error?.data?.message ||
      error?.message ||
      'Unable to sign in. Please try again.';
    console.error('Login failed:', error);
    logEvent('Login failed: ' + message);
    authError.textContent = message;
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
    } else {
      const record = await window.desktop.clockIn({ token: state.token });
      state.attendance = record;
      setAttendanceDisplay();
      logEvent('Clocked in at ' + new Date(record.clockIn).toLocaleTimeString());
    }
  } catch (error) {
    logEvent('Attendance update failed: ' + (error?.response?.data?.message || error.message));
  }
});

startBtn.addEventListener('click', async () => {
  if (!state.token || !taskSelect.value) return;
  setButtonsState({ running: false, loading: true });
  try {
    await ensureClockedIn();
    const log = await window.desktop.startTimer({ token: state.token, taskId: taskSelect.value });
    state.activeLog = log;
    setStatus('Running', 'Tracking started.');
    setButtonsState({ running: true, loading: false });
    startTimer();
    showNotification('WebWork Tracker', 'Timer started successfully!');
    logEvent(`Started timer for task ${taskSelect.selectedOptions[0].text}`);
  } catch (error) {
    setButtonsState({ running: false, loading: false });
    logEvent('Failed to start timer: ' + (error?.response?.data?.message || error.message));
  }
});

pauseBtn.addEventListener('click', async () => {
  if (!state.token) return;
  setButtonsState({ running: true, loading: true });
  try {
    await window.desktop.pauseTimer({ token: state.token });
    setStatus('Paused', 'Timer paused.');
    setButtonsState({ running: false, loading: false });
    stopTimer();
    showNotification('WebWork Tracker', 'Timer paused.');
    logEvent('Timer paused.');
  } catch (error) {
    setButtonsState({ running: true, loading: false });
    logEvent('Failed to pause timer: ' + (error?.response?.data?.message || error.message));
  }
});

resumeBtn.addEventListener('click', async () => {
  if (!state.token || !taskSelect.value) return;
  setButtonsState({ running: false, loading: true });
  try {
    await ensureClockedIn();
    const log = await window.desktop.resumeTimer({ token: state.token, taskId: taskSelect.value });
    state.activeLog = log;
    setStatus('Running', 'Timer resumed.');
    setButtonsState({ running: true, loading: false });
    startTimer();
    showNotification('WebWork Tracker', 'Timer resumed.');
    logEvent('Timer resumed.');
  } catch (error) {
    setButtonsState({ running: false, loading: false });
    logEvent('Failed to resume timer: ' + (error?.response?.data?.message || error.message));
  }
});

stopBtn.addEventListener('click', async () => {
  if (!state.token) return;
  setButtonsState({ running: true, loading: true });
  try {
    await window.desktop.stopTimer({ token: state.token });
    state.activeLog = null;
    setStatus('Idle', 'Timer stopped.');
    setButtonsState({ running: false, loading: false });
    stopTimer();
    showNotification('WebWork Tracker', 'Timer stopped.');
    logEvent('Timer stopped.');
  } catch (error) {
    setButtonsState({ running: true, loading: false });
    logEvent('Failed to stop timer: ' + (error?.response?.data?.message || error.message));
  }
});

window.desktop.onStatus((payload) => {
  if (payload.type === 'capture') {
    // Enhanced screenshot logging with analysis
    let analysisInfo = '';
    if (payload.analysis) {
      const { browserWindows, workRelatedSites, personalSites, productivityScore } = payload.analysis;
      analysisInfo = ` • Analysis: ${browserWindows} browsers, ${workRelatedSites} work sites, ${personalSites} personal sites (${(productivityScore * 100).toFixed(1)}% productive)`;
    }
    
    logEvent('Screenshot captured at ' + new Date(payload.timestamp).toLocaleTimeString() + analysisInfo);
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
    // Enhanced activity logging with network analysis
    let networkInfo = '';
    if (payload.networkAnalysis) {
      const { domain, category, isWorkRelated } = payload.networkAnalysis;
      networkInfo = ` • ${domain} (${category}) ${isWorkRelated ? '✅' : '❌'}`;
    }
    
    let productivityInfo = '';
    if (payload.productivityMetrics) {
      const { productivityScore, workSites, personalSites } = payload.productivityMetrics;
      productivityInfo = ` • Productivity: ${(productivityScore * 100).toFixed(1)}% (Work: ${workSites}, Personal: ${personalSites})`;
    }
    
    logEvent(
      `Activity: ${payload.windowTitle || 'unknown window'}${
        payload.idleSeconds ? ` • idle ${payload.idleSeconds}s` : ''
      }${payload.keyboardCount !== undefined ? ` • keys ${payload.keyboardCount}` : ''}${
        payload.mouseCount !== undefined ? ` • mouse ${payload.mouseCount}` : ''
      }${networkInfo}${productivityInfo}`
    );
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

setButtonsState({ running: false });

// Theme toggle event listener
themeToggle.addEventListener('click', toggleDarkMode);

// Initialize dark mode
document.documentElement.setAttribute('data-theme', state.isDarkMode ? 'dark' : 'light');
themeToggle.querySelector('.theme-icon').textContent = state.isDarkMode ? '☀️' : '🌙';

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 's':
        event.preventDefault();
        if (!startBtn.disabled) startBtn.click();
        break;
      case 'p':
        event.preventDefault();
        if (!pauseBtn.disabled) pauseBtn.click();
        break;
      case 'r':
        event.preventDefault();
        if (!resumeBtn.disabled) resumeBtn.click();
        break;
      case 't':
        event.preventDefault();
        if (!stopBtn.disabled) stopBtn.click();
        break;
    }
  }
});

// Desktop notifications
const showNotification = (title, body, icon = null) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon });
  }
};

const showBreakReminderModal = () => {
  // Create break reminder modal
  const modal = document.createElement('div');
  modal.className = 'break-reminder-modal';
  modal.innerHTML = `
    <div class="break-reminder-content">
      <div class="break-reminder-icon">☕</div>
      <h3>Time for a Break!</h3>
      <p>You've been working for a while. Take a 5-minute break to stay productive!</p>
      <div class="break-reminder-actions">
        <button id="break-reminder-dismiss" class="btn btn-secondary">Dismiss</button>
        <button id="break-reminder-take-break" class="btn btn-primary">Take Break</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  document.getElementById('break-reminder-dismiss').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  document.getElementById('break-reminder-take-break').addEventListener('click', () => {
    // Pause tracking for break
    if (pauseBtn && !pauseBtn.disabled) {
      pauseBtn.click();
    }
    document.body.removeChild(modal);
    showNotification('Break Started', 'Take a 5-minute break. Tracking paused.');
  });
};

const openAnalytics = () => {
  // Open analytics in a new window
  const analyticsWindow = window.open('analytics.html', 'analytics', 'width=900,height=700,resizable=yes,scrollbars=yes');
  if (analyticsWindow) {
    analyticsWindow.focus();
  }
};

const showProductivityInsights = () => {
  // Show productivity insights in a modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>🎯 Productivity Insights</h3>
        <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <div class="modal-body">
        <div class="productivity-stats">
          <div class="stat-card">
            <h4>📊 Current Session</h4>
            <p>Focus Time: <span id="focus-time">0 min</span></p>
            <p>Distraction Time: <span id="distraction-time">0 min</span></p>
            <p>Productivity Score: <span id="productivity-score">0%</span></p>
          </div>
          <div class="stat-card">
            <h4>🌐 Website Activity</h4>
            <p>Work Sites: <span id="work-sites">0</span></p>
            <p>Personal Sites: <span id="personal-sites">0</span></p>
            <p>Total Sites: <span id="total-sites">0</span></p>
          </div>
          <div class="stat-card">
            <h4>⏰ Break Reminders</h4>
            <p>Next Break: <span id="next-break">60 min</span></p>
            <p>Daily Target: <span id="daily-target">8 hours</span></p>
            <p>Progress: <span id="daily-progress">0%</span></p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Update stats (this would be connected to real data in production)
  setTimeout(() => {
    document.getElementById('focus-time').textContent = '45 min';
    document.getElementById('distraction-time').textContent = '15 min';
    document.getElementById('productivity-score').textContent = '75%';
    document.getElementById('work-sites').textContent = '12';
    document.getElementById('personal-sites').textContent = '3';
    document.getElementById('total-sites').textContent = '15';
    document.getElementById('next-break').textContent = '15 min';
    document.getElementById('daily-target').textContent = '8 hours';
    document.getElementById('daily-progress').textContent = '60%';
  }, 100);
};

const openBreakSettings = async () => {
  console.log('Opening break settings...');
  const modal = document.getElementById('break-settings-modal');
  if (!modal) {
    console.error('Break settings modal not found!');
    return;
  }

  // Load current settings
  try {
    const token = localStorage.getItem('webwork_token');
    
    // Try to load from backend if user is logged in
    if (token) {
      console.log('User is logged in, trying to load from backend...');
      try {
        const settings = await window.desktop.getBreakSettings({ token });
        if (settings) {
          document.getElementById('break-enabled').checked = settings.breakReminderEnabled;
          document.getElementById('break-interval').value = settings.breakReminderInterval;
          document.getElementById('daily-target').value = settings.dailyTargetHours;
          console.log('Settings loaded from backend:', settings);
        }
      } catch (backendError) {
        console.warn('Backend not available, loading from local storage:', backendError.message);
        // Fallback to local storage
        const localSettings = JSON.parse(localStorage.getItem('webwork_break_settings') || '{}');
        document.getElementById('break-enabled').checked = localSettings.breakReminderEnabled !== false;
        document.getElementById('break-interval').value = localSettings.breakReminderInterval || 60;
        document.getElementById('daily-target').value = localSettings.dailyTargetHours || 8;
        console.log('Settings loaded from local storage:', localSettings);
      }
    } else {
      console.log('User not logged in, loading from local storage');
      // Load from local storage
      const localSettings = JSON.parse(localStorage.getItem('webwork_break_settings') || '{}');
      document.getElementById('break-enabled').checked = localSettings.breakReminderEnabled !== false;
      document.getElementById('break-interval').value = localSettings.breakReminderInterval || 60;
      document.getElementById('daily-target').value = localSettings.dailyTargetHours || 8;
      console.log('Settings loaded from local storage:', localSettings);
    }
  } catch (error) {
    console.warn('Failed to load break settings:', error);
    // Use defaults
    document.getElementById('break-enabled').checked = true;
    document.getElementById('break-interval').value = 60;
    document.getElementById('daily-target').value = 8;
  }

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  modal.style.visibility = 'visible';
  modal.style.opacity = '1';
  console.log('Break settings modal opened');
  console.log('Modal classes:', modal.className);
  console.log('Modal style display:', modal.style.display);
};

const closeBreakSettings = () => {
  console.log('Closing break settings...');
  const modal = document.getElementById('break-settings-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
    console.log('Break settings modal closed');
    console.log('Modal classes:', modal.className);
    console.log('Modal style display:', modal.style.display);
  } else {
    console.error('Modal not found when trying to close!');
  }
};

// Global function for testing
window.testCloseModal = () => {
  console.log('Testing modal close...');
  closeBreakSettings();
};

window.testSaveSettings = () => {
  console.log('Testing save settings...');
  saveBreakSettings();
};

window.testSaveButton = () => {
  console.log('Testing save button click...');
  const saveBtn = document.getElementById('save-settings');
  if (saveBtn) {
    console.log('Save button found, triggering click');
    saveBtn.click();
  } else {
    console.error('Save button not found!');
  }
};

const saveBreakSettings = async () => {
  console.log('Saving break settings...');
  try {
    // Get form values
    const breakEnabled = document.getElementById('break-enabled');
    const breakInterval = document.getElementById('break-interval');
    const dailyTarget = document.getElementById('daily-target');
    
    console.log('Form elements found:', {
      breakEnabled: !!breakEnabled,
      breakInterval: !!breakInterval,
      dailyTarget: !!dailyTarget
    });

    if (!breakEnabled || !breakInterval || !dailyTarget) {
      console.error('Form elements not found!');
      showNotification('Error', 'Form elements not found');
      return;
    }

    const settings = {
      breakReminderEnabled: breakEnabled.checked,
      breakReminderInterval: parseInt(breakInterval.value),
      dailyTargetHours: parseFloat(dailyTarget.value)
    };

    console.log('Saving settings:', settings);
    
    // Save to local storage
    localStorage.setItem('webwork_break_settings', JSON.stringify(settings));
    console.log('Settings saved to local storage');
    
    // Try to save to backend if user is logged in
    const token = localStorage.getItem('webwork_token');
    if (token) {
      try {
        console.log('User is logged in, trying to save to backend...');
        const result = await window.desktop.updateBreakSettings({ token, settings });
        console.log('Save result from backend:', result);
        showNotification('Success', 'Break settings saved to server successfully!');
      } catch (backendError) {
        console.warn('Backend save failed, using local storage only:', backendError.message);
        showNotification('Success', 'Break settings saved locally (server not available)');
      }
    } else {
      console.log('User not logged in, saving locally only');
      showNotification('Success', 'Break settings saved locally!');
    }
    
    closeBreakSettings();
  } catch (error) {
    console.error('Failed to save break settings:', error);
    console.error('Error details:', error.message, error.stack);
    showNotification('Error', 'Failed to save settings: ' + error.message);
  }
};

// Settings modal event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, setting up event listeners...');
  
  // Settings button
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    console.log('Settings button found, adding event listener');
    settingsBtn.addEventListener('click', () => {
      console.log('Settings button clicked');
      openBreakSettings();
    });
  } else {
    console.error('Settings button not found!');
  }

  const closeBtn = document.getElementById('close-settings');
  const cancelBtn = document.getElementById('cancel-settings');
  const saveBtn = document.getElementById('save-settings');

  console.log('Modal buttons found:', {
    closeBtn: !!closeBtn,
    cancelBtn: !!cancelBtn,
    saveBtn: !!saveBtn
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      console.log('Close button clicked');
      closeBreakSettings();
    });
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      console.log('Cancel button clicked');
      closeBreakSettings();
    });
  }
  if (saveBtn) {
    console.log('Save button found, adding event listener');
    saveBtn.addEventListener('click', (e) => {
      console.log('Save button clicked', e);
      e.preventDefault();
      e.stopPropagation();
      saveBreakSettings();
    });
    
    // Also add a simple test
    saveBtn.addEventListener('mousedown', () => {
      console.log('Save button mousedown');
    });
  } else {
    console.error('Save button not found!');
  }

  // Close modal when clicking outside
  const modal = document.getElementById('break-settings-modal');
  if (modal) {
    console.log('Modal found, adding outside click listener');
    modal.addEventListener('click', (e) => {
      console.log('Modal clicked, target:', e.target, 'modal:', modal);
      if (e.target === modal) {
        console.log('Clicked outside modal, closing...');
        closeBreakSettings();
      }
    });
  } else {
    console.error('Modal not found!');
  }

  // Add escape key listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('break-settings-modal');
      if (modal && !modal.classList.contains('hidden')) {
        console.log('Escape key pressed, closing modal');
        closeBreakSettings();
      }
    }
  });
});

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

// Handle tray events
window.desktop.onTrayStart(() => {
  if (startBtn && !startBtn.disabled) {
    startBtn.click();
  }
});

  window.desktop.onTrayStop(() => {
    if (stopBtn && !stopBtn.disabled) {
      stopBtn.click();
    }
  });

  // Break reminder handler
  window.desktop.onBreakReminder(() => {
    showBreakReminderModal();
  });

  // Analytics button
  const analyticsBtn = document.getElementById('analytics-btn');
  if (analyticsBtn) {
    analyticsBtn.addEventListener('click', () => {
      openAnalytics();
    });
  }

  // Productivity button
  const productivityBtn = document.getElementById('productivity-btn');
  if (productivityBtn) {
    productivityBtn.addEventListener('click', () => {
      showProductivityInsights();
    });
  }

restoreSession();
