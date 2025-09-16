import { useEffect, useState } from 'react';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import Topbar from '../components/Topbar.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { projectApi } from '../services/api.js';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await projectApi.list();
        setProjects(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const renderProjects = () => {
    if (loading) return <Loader message="Loading projects" />;
    if (error)
      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Failed to load projects. {error.response?.data?.message || error.message}
        </div>
      );
    if (!projects.length)
      return <EmptyState title="No projects available" description="Create a project from the API to get started." />;

    return (
      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">{project.name}</h3>
                <p className="text-sm text-slate-500">{project.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge status={project.status}>{project.status.replace('_', ' ')}</Badge>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                  Team members: {project.team?.members?.length ?? 0}
                </span>
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-600">
              <h4 className="font-semibold text-slate-700">Tasks</h4>
              {project.tasks?.length ? (
                <ul className="mt-3 space-y-2">
                  {project.tasks.map((task) => (
                    <li key={task.id} className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 md:flex-row md:items-center">
                      <div>
                        <div className="font-medium text-slate-800">{task.title}</div>
                        <div className="text-xs text-slate-500">Assigned to {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}</div>
                      </div>
                      <div className="mt-2 flex items-center gap-3 md:mt-0">
                        <Badge status={task.status}>{task.status.replace('_', ' ')}</Badge>
                        {task.dueDate && (
                          <span className="text-xs uppercase text-slate-400">Due {task.dueDate}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-400">No tasks yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout topbar={<Topbar title="Projects" />}>
      {renderProjects()}
    </DashboardLayout>
  );
};

export default ProjectsPage;
