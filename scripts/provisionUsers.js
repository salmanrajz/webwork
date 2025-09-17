const API_BASE = 'https://tracking.riuman.com/api';
const ADMIN_EMAIL = 'admin@webwork.dev';
const ADMIN_PASSWORD = 'Password123!';
const DEFAULT_PASSWORD = '@Riuman786!!!';
const DEFAULT_TASK = {
  title: 'Default Task',
  description: 'Automatically assigned starter task.',
  status: 'todo'
};

const groups = {
  CL1: [
    'Khadija', 'Sidra', 'Junaid Ghouri', 'Junaid Awan', 'Muzammil', 'Teeha', 'Hyder', 'Arsalan',
    'Dua', 'Samir Arabic', 'Adnan', 'Asma', 'Afham', 'Faris Chandio', 'Faris Razzaq', 'Shahid',
    'Saad', 'Zahid', 'Ramail', 'Asheer Rehman', 'Abdul Ahad', 'Naima', 'Qadeer', 'Rayyan Arabic',
    'Farhana', 'Asad', 'Husnain Siddiqui', 'Seerat', 'Fariha', 'Hasnain'
  ],
  CL3: [
    'Jahanzaib', 'Yousuf', 'Bilal', 'Haris', 'Hamza', 'Ahmar', 'Dawood', 'Dua', 'Afham',
    'Fahad Arabic', 'Aaraiz', 'Mehak', 'Sameer', 'Mohsin', 'HUFFAZ', 'Noor', 'Shiva', 'REHAN',
    'SALEEM KHAN', 'AREESHA', 'MUNTAHA', 'ALVEENA'
  ],
  CL5: [
    'Arsal', 'Ali Arabic', 'Ahmed', 'Anoosha', 'Ayesha', 'Muneeb', 'Yaqoob'
  ]
};

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const bodyText = await res.text();
  let body;
  try {
    body = JSON.parse(bodyText || '{}');
  } catch (err) {
    body = bodyText;
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
};

(async () => {
  try {
    const loginBody = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const token = loginBody?.data?.token;
    if (!token) {
      console.error('Failed to obtain admin token. Response:', loginBody);
      process.exit(1);
    }

    const authedFetch = (endpoint, init = {}) => {
      const method = (init.method || 'GET').toUpperCase();
      const headers = {
        Authorization: `Bearer ${token}`,
        ...(init.headers || {})
      };
      if (method !== 'GET' && method !== 'HEAD') {
        headers['Content-Type'] = 'application/json';
      }
      return request(`${API_BASE}${endpoint}`, { ...init, method, headers });
    };

    const projectsBody = await authedFetch('/projects', { method: 'GET' });
    const projects = projectsBody?.data || [];
    if (!projects.length) {
      throw new Error('No projects found. Please create a project first.');
    }
    const defaultProjectId = projects[0].id;

    const ensureUser = async (fullName, group) => {
      const [first, ...rest] = fullName.split(' ');
      const lastName = rest.join(' ') || group;
      const email = `${slugify(fullName)}@riuman.com`;

      try {
        const createRes = await authedFetch('/users', {
          method: 'POST',
          body: JSON.stringify({
            firstName: first,
            lastName,
            email,
            password: DEFAULT_PASSWORD,
            role: 'employee'
          })
        });
        console.log(`Created user ${email}`);
        return { id: createRes?.id || createRes?.data?.id, email };
      } catch (error) {
        if (/HTTP 409/.test(error.message)) {
          console.log(`User ${email} already exists, fetching id...`);
          const searchRes = await authedFetch(`/users?search=${encodeURIComponent(email)}&limit=1`, {
            method: 'GET'
          });
          const existing = (searchRes?.data || searchRes?.users || []).find((u) => u.email === email);
          if (!existing) throw new Error(`Unable to locate existing user ${email}`);
          return { id: existing.id, email };
        }
        throw error;
      }
    };

    const assignTask = async (userId, email) => {
      await authedFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          ...DEFAULT_TASK,
          assigneeId: userId,
          projectId: defaultProjectId
        })
      });
      console.log(`Assigned default task to ${email}`);
    };

    for (const [group, names] of Object.entries(groups)) {
      for (const name of names) {
        const fullName = `${name} ${group}`;
        const { id, email } = await ensureUser(fullName, group);
        await assignTask(id, email);
      }
    }

    console.log('All users processed.');
  } catch (error) {
    console.error('Provisioning failed:', error.message || error);
    process.exit(1);
  }
})();
