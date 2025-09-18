import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader.jsx';
import Topbar from '../components/Topbar.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { userApi } from '../services/api.js';

const AgentsPage = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user.role === 'employee') {
      setLoading(false);
      setAgents([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await userApi.list({ limit: 100 });
        setAgents(response.users || []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user.role]);

  if (user.role === 'employee') {
    return (
      <DashboardLayout topbar={<Topbar title="Agents" />}>
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-6 text-amber-700 dark:text-amber-300 transition-colors duration-300">
          Access to the agents directory is restricted.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout topbar={<Topbar title="Agents" />}>
      {loading ? (
        <Loader message="Loading agents" />
      ) : error ? (
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-6 text-rose-700 dark:text-rose-300 transition-colors duration-300">
          Failed to load agents. {error.response?.data?.message || error.message}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Team directory</h3>
            <span className="text-xs uppercase text-slate-400 dark:text-slate-500">{agents.length} agents</span>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-600 text-sm text-slate-600 dark:text-slate-300">
            {agents.map((agent) => (
              <li key={agent.id} className="flex items-center justify-between py-3 transition-colors duration-300">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {agent.firstName} {agent.lastName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{agent.email}</p>
                </div>
                <div className="flex items-center gap-3 text-xs uppercase text-slate-400 dark:text-slate-500">
                  <span>{agent.role}</span>
                  <Link
                    to={`/agents/${agent.id}`}
                    className="rounded-full bg-primary/10 dark:bg-primary/20 px-3 py-1 font-semibold text-primary transition hover:bg-primary/20 dark:hover:bg-primary/30"
                  >
                    View analytics
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AgentsPage;
