import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import NotificationCenter from './NotificationCenter.jsx';

const Topbar = ({ title, actions }) => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  return (
    <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-8 py-5 transition-colors duration-300">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Logged in as {user?.role?.toUpperCase()}</p>
      </div>
      <div className="flex items-center gap-3">
        <NotificationCenter />
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200"
          title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        {actions}
      </div>
    </header>
  );
};

export default Topbar;
