const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  listTasks: (payload) => ipcRenderer.invoke('tasks:list', payload),
  getActiveLog: (payload) => ipcRenderer.invoke('timelog:active', payload),
  startTimer: (payload) => ipcRenderer.invoke('timer:start', payload),
  resumeTimer: (payload) => ipcRenderer.invoke('timer:resume', payload),
  pauseTimer: (payload) => ipcRenderer.invoke('timer:pause', payload),
  stopTimer: (payload) => ipcRenderer.invoke('timer:stop', payload),
   clockIn: (payload) => ipcRenderer.invoke('attendance:clockIn', payload),
   clockOut: (payload) => ipcRenderer.invoke('attendance:clockOut', payload),
  getActiveAttendance: (payload) => ipcRenderer.invoke('attendance:active', payload),
  sendGpsData: (gpsData) => ipcRenderer.invoke('gps:sendData', gpsData),
  updateTrayControls: (payload) => ipcRenderer.send('tray:updateControls', payload),
  onTrayCommand: (callback) => ipcRenderer.on('tray:command', (_event, action) => callback(action)),
  logout: () => ipcRenderer.send('tracker:logout'),
  onStatus: (callback) => ipcRenderer.on('tracker:status', (_event, data) => callback(data)),
  onPermissionStatus: (callback) => ipcRenderer.on('permissions:status', (_event, data) => callback(data)),
  getPermissionStatus: () => ipcRenderer.invoke('permissions:getStatus'),
  refreshPermissionStatus: () => ipcRenderer.invoke('permissions:refresh'),
  openSystemSettings: (payload) => ipcRenderer.invoke('permissions:openSystem', payload)
});
