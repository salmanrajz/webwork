import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';

const Sidebar = ({ onClose }) => {
  const { logout, user } = useAuth();
  const baseItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/teams', label: 'Teams', icon: '👥' },
    { path: '/projects', label: 'Projects', icon: '🗂️' },
    { path: '/timesheets', label: 'Timesheets', icon: '⏱️' }
  ];

  let navItems = baseItems;
  if (user && user.role !== 'employee') {
    navItems = [
      baseItems[0],
      { path: '/agents', label: 'Agents', icon: '🧑‍💻' },
      { path: '/tasks', label: 'Tasks', icon: '🧾' },
      { path: '/notifications', label: 'Notifications', icon: '🔔' },
      { path: '/gps', label: 'GPS Tracking', icon: '📍' },
      ...(user.role === 'admin' ? [{ path: '/users', label: 'Users', icon: '🧑‍⚖️' }] : []),
      ...(user.role === 'admin' ? [{ path: '/restrictions', label: 'Restrictions', icon: '🚫' }] : []),
      ...(user.role !== 'employee' ? [{ path: '/tasks/assign', label: 'Assign tasks', icon: '🗂' }] : []),
      ...baseItems.slice(1)
    ];
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-white dark:bg-slate-800 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between px-6 py-6">
        <Logo />
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
        <div className="mb-2 font-medium">{user?.firstName} {user?.lastName}</div>
        <button
          onClick={logout}
          className="rounded-md px-3 py-2 text-left text-sm text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
