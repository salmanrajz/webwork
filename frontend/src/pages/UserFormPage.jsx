import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import Topbar from '../components/Topbar.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { userApi } from '../services/api.js';

const defaultForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'employee',
  isActive: true
};

const UserFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    const loadUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await userApi.get(id);
        setForm({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: '',
          role: data.role,
          isActive: data.isActive
        });
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id, isEdit]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        const payload = {
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
          isActive: form.isActive
        };
        if (form.password) {
          payload.password = form.password;
        }
        await userApi.update(id, payload);
      } else {
        await userApi.create({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          role: form.role
        });
      }
      navigate('/users');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  if (user.role !== 'admin') {
    return (
      <DashboardLayout topbar={<Topbar title="Users" />}>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-700">
          Only administrators can manage users.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout topbar={<Topbar title={isEdit ? 'Edit user' : 'Create user'} />}>
      {loading ? (
        <Loader message="Loading user" />
      ) : (
        <form onSubmit={handleSubmit} className="max-w-xl space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-600">First name</label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Last name</label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              disabled={isEdit}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">
              {isEdit ? 'Reset password (optional)' : 'Password'}
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={isEdit ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              required={!isEdit}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-600">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>
            {isEdit && (
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  Active account
                </label>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error.response?.data?.message || error.message}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/users')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create user'}
            </Button>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
};

export default UserFormPage;
