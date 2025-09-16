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
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-700">
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
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Failed to load agents. {error.response?.data?.message || error.message}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Team directory</h3>
            <span className="text-xs uppercase text-slate-400">{agents.length} agents</span>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 text-sm text-slate-600">
            {agents.map((agent) => (
              <li key={agent.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-800">
                    {agent.firstName} {agent.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{agent.email}</p>
                </div>
                <div className="flex items-center gap-3 text-xs uppercase text-slate-400">
                  <span>{agent.role}</span>
                  <Link
                    to={`/agents/${agent.id}`}
                    className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary transition hover:bg-primary/20"
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
