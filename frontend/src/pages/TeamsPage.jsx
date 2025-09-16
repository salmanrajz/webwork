import { useEffect, useState } from 'react';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import Topbar from '../components/Topbar.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { teamApi, userApi } from '../services/api.js';

const TeamsPage = () => {
  const { user } = useAuth();
  const canManage = user.role !== 'employee';
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', managerId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamData, userData] = await Promise.all([
        teamApi.list(),
        canManage ? userApi.list({ limit: 100 }) : Promise.resolve({ users: [] })
      ]);
      setTeams(teamData);
      setUsers(userData.users ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  const handleChange = (event) => {
    const { name: field, value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await teamApi.create({
        name: form.name,
        description: form.description,
        managerId: form.managerId || null
      });
      setForm({ name: '', description: '', managerId: '' });
      await loadTeams();
    } catch (err) {
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTeams = () => {
    if (loading) return <Loader message="Loading teams" />;
    if (error)
      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Failed to load teams. {error.response?.data?.message || error.message}
        </div>
      );
    if (!teams.length)
      return <EmptyState title="No teams yet" description="Create your first team to get started." />;

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((team) => (
          <div key={team.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{team.name}</h3>
                <p className="text-sm text-slate-500">{team.description}</p>
              </div>
              {team.manager && (
                <Badge status="active">Manager: {team.manager.firstName}</Badge>
              )}
            </div>
            <div className="mt-4 text-sm text-slate-600">
              <h4 className="font-semibold text-slate-700">Members</h4>
              <ul className="mt-2 space-y-1">
                {team.members?.map((member) => (
                  <li key={member.id} className="flex items-center justify-between">
                    <span>
                      {member.firstName} {member.lastName}
                    </span>
                    <span className="text-xs uppercase text-slate-400">
                      {member.TeamMember?.role || member.role || 'member'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {team.projects?.length > 0 && (
              <div className="mt-4 text-sm text-slate-600">
                <h4 className="font-semibold text-slate-700">Projects</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {team.projects.map((project) => (
                    <li key={project.id} className="flex items-center justify-between">
                      <span>{project.name}</span>
                      <Badge status={project.status}>{project.status.replace('_', ' ')}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout topbar={<Topbar title="Teams" />}>
      <div className="space-y-8">
        {canManage && (
          <form
            onSubmit={handleCreateTeam}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-800">Create team</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <label className="text-sm font-medium text-slate-600">Name</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-sm font-medium text-slate-600">Manager</label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  name="managerId"
                  value={form.managerId}
                  onChange={handleChange}
                >
                  <option value="">Select manager</option>
                  {users
                    .filter((person) => person.role !== 'employee')
                    .map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.firstName} {person.lastName} ({person.role})
                      </option>
                    ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="text-sm font-medium text-slate-600">Description</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create team'}
              </Button>
            </div>
          </form>
        )}

        {renderTeams()}
      </div>
    </DashboardLayout>
  );
};

export default TeamsPage;
