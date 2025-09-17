import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import Badge from '../components/Badge.jsx';
import Topbar from '../components/Topbar.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { userApi } from '../services/api.js';

const roleLabel = {
  admin: 'Admin',
  manager: 'Manager',
  employee: 'Employee'
};

const UsersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const canManage = useMemo(() => user.role === 'admin', [user.role]);

  const loadUsers = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userApi.list({ limit: 20, ...params });
      setUsers(response.users || []);
      setMeta(response.meta || { page: 1, pages: 1, total: response.users?.length ?? 0 });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    await loadUsers({ search });
  };

  const handleToggleActive = async (id, current) => {
    try {
      await userApi.update(id, { isActive: !current });
      await loadUsers({ search, page: meta.page });
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;
    try {
      await userApi.remove(id);
      await loadUsers({ search, page: meta.page });
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const pageItems = Array.from({ length: meta.pages }, (_, index) => index + 1);

  return (
    <DashboardLayout topbar={<Topbar title="Users" />}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex flex-1 max-w-md items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or email"
              className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
          {canManage && <Button onClick={() => navigate('/users/new')}>Create user</Button>}
        </div>

        {loading ? (
          <Loader message="Loading users" />
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            Failed to load users. {error.response?.data?.message || error.message}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((item) => (
                  <tr key={item.id} className="text-slate-600">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {item.firstName} {item.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-3">{item.email}</td>
                    <td className="px-4 py-3">{roleLabel[item.role] || item.role}</td>
                    <td className="px-4 py-3">
                      <Badge status={item.isActive ? 'active' : 'blocked'}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right text-xs">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/users/${item.id}/edit`}
                            className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:bg-slate-100"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(item.id, item.isActive)}
                            className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:bg-slate-100"
                          >
                            {item.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.pages > 1 && (
          <div className="flex items-center justify-end gap-2 text-xs">
            {pageItems.map((pageItem) => (
              <button
                key={pageItem}
                type="button"
                onClick={() => loadUsers({ page: pageItem, search })}
                className={`rounded-full px-3 py-1 font-semibold transition ${
                  meta.page === pageItem ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pageItem}
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;
