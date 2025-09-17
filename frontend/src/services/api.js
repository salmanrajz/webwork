import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('webwork_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('webwork_token');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    return data.data;
  },
  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data.data;
  }
};

export const userApi = {
  async me() {
    const { data } = await api.get('/users/me');
    return data.data;
  },
  async list(params = {}) {
    const { data } = await api.get('/users', { params });
    return { users: data.data, meta: data.meta };
  },
  async get(id) {
    const { data } = await api.get(`/users/${id}`);
    return data.data;
  },
  async create(payload) {
    const { data } = await api.post('/users', payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await api.patch(`/users/${id}`, payload);
    return data.data;
  },
  async remove(id) {
    await api.delete(`/users/${id}`);
  }
};

export const dashboardApi = {
  async admin() {
    const { data } = await api.get('/dashboard/admin');
    return data.data;
  }
};

export const teamApi = {
  async list() {
    const { data } = await api.get('/teams');
    return data.data;
  },
  async create(payload) {
    const { data } = await api.post('/teams', payload);
    return data.data;
  },
  async assign(teamId, userIds) {
    const { data } = await api.post(`/teams/${teamId}/members`, { userIds });
    return data.data;
  }
};

export const projectApi = {
  async list() {
    const { data } = await api.get('/projects');
    return data.data;
  }
};

export const taskApi = {
  async list(params = {}) {
    const { data } = await api.get('/tasks', { params });
    return data.data;
  },
  async create(payload) {
    const { data } = await api.post('/tasks', payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await api.patch(`/tasks/${id}`, payload);
    return data.data;
  },
  async remove(id) {
    await api.delete(`/tasks/${id}`);
  },
  async assign(payload) {
    const { data } = await api.post('/tasks/assign', payload);
    return data.data;
  }
};

export const timeLogApi = {
  async timesheet({ period = 'weekly', date, userId } = {}) {
    const params = new URLSearchParams();
    params.set('period', period);
    if (date) params.set('date', date);
    if (userId) params.set('userId', userId);
    const { data } = await api.get(`/timelogs/timesheet?${params.toString()}`);
    return data.data;
  },
  async list(query = {}) {
    const params = new URLSearchParams(query);
    const { data } = await api.get(`/timelogs?${params.toString()}`);
    return data.data;
  },
  async start(taskId) {
    const { data } = await api.post('/timelogs/start', { taskId });
    return data.data;
  },
  async pause() {
    const { data } = await api.post('/timelogs/pause');
    return data.data;
  },
  async stop() {
    const { data } = await api.post('/timelogs/stop');
    return data.data;
  },
  async resume(taskId) {
    const { data } = await api.post('/timelogs/resume', { taskId });
    return data.data;
  },
  async active() {
    const { data } = await api.get('/timelogs/active');
    return data.data;
  }
};

export const screenshotApi = {
  async list(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.set(key, value);
      }
    });
    const query = search.toString();
    const { data } = await api.get(query ? `/screenshots?${query}` : '/screenshots');
    return data.data;
  },
  async upload(formData) {
    const { data } = await api.post('/screenshots', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.data;
  },
  async remove(id) {
    await api.delete(`/screenshots/${id}`);
  }
};

export const activityApi = {
  async list(params = {}) {
    const { data } = await api.get('/activities', { params });
    return data.data;
  },
  async summary(params = {}) {
    const { data } = await api.get('/activities/summary', { params });
    return data.data;
  },
  async summaryByApp(params = {}) {
    const { data } = await api.get('/activities/summary/apps', { params });
    return data.data;
  }
};

export const attendanceApi = {
  async list(params = {}) {
    const { data } = await api.get('/attendance', { params });
    return data.data;
  },
  async active() {
    const { data } = await api.get('/attendance/active');
    return data.data;
  },
  async clockIn(payload = {}) {
    const { data } = await api.post('/attendance/clock-in', payload);
    return data.data;
  },
  async clockOut(payload = {}) {
    const { data } = await api.post('/attendance/clock-out', payload);
    return data.data;
  }
};

export const shiftApi = {
  async list(params = {}) {
    const { data } = await api.get('/shifts', { params });
    return data.data;
  },
  async create(payload) {
    const { data } = await api.post('/shifts', payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await api.patch(`/shifts/${id}`, payload);
    return data.data;
  },
  async remove(id) {
    await api.delete(`/shifts/${id}`);
  }
};

export const realtimeApi = {
  async overview() {
    const { data } = await api.get('/realtime/overview');
    return data.data;
  }
};

export default api;
