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

const state = {
  token: null,
  user: null,
  activeLog: null,
  tasks: [],
  attendance: null
};

const setStatus = (text, note = '') => {
  statusLabel.textContent = text;
  statusNote.textContent = note;
};

const shouldShowLog = process.env.WEBWORK_SILENCE_LOGS !== 'true';

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
  try {
    await ensureClockedIn();
    const log = await window.desktop.startTimer({ token: state.token, taskId: taskSelect.value });
    state.activeLog = log;
    setStatus('Running', 'Tracking started.');
    setButtonsState({ running: true });
    logEvent(`Started timer for task ${taskSelect.selectedOptions[0].text}`);
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
    logEvent(
      `Activity sample: ${payload.windowTitle || 'unknown window'}${
        payload.idleSeconds ? ` • idle ${payload.idleSeconds}s` : ''
      }${payload.keyboardCount !== undefined ? ` • keys ${payload.keyboardCount}` : ''}${
        payload.mouseCount !== undefined ? ` • mouse ${payload.mouseCount}` : ''
      }`
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
restoreSession();
