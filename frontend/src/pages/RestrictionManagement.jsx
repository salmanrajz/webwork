import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const RestrictionManagement = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [rules, setRules] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    type: 'block',
    targetType: 'domain',
    targetValue: '',
    severity: 'medium',
    isActive: true,
    appliesTo: 'all',
    alertMessage: '',
    timeRestrictions: null
  });

  // Fetch restriction rules
  const fetchRules = async () => {
    try {
      const token = localStorage.getItem('webwork_token');
      const response = await fetch('/api/restrictions/rules', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setRules(data.data);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  // Fetch violations
  const fetchViolations = async () => {
    try {
      const token = localStorage.getItem('webwork_token');
      const response = await fetch('/api/restrictions/violations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setViolations(data.data);
      }
    } catch (error) {
      console.error('Error fetching violations:', error);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchViolations();
    setLoading(false);
  }, []);

  // Create new rule
  const createRule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('webwork_token');
      const response = await fetch('/api/restrictions/rules', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRule)
      });
      const data = await response.json();
      if (data.success) {
        setRules([...rules, data.data]);
        setShowCreateModal(false);
        setNewRule({
          name: '',
          description: '',
          type: 'block',
          targetType: 'domain',
          targetValue: '',
          severity: 'medium',
          isActive: true,
          appliesTo: 'all',
          alertMessage: '',
          timeRestrictions: null
        });
      }
    } catch (error) {
      console.error('Error creating rule:', error);
    }
  };

  // Update rule
  const updateRule = async (id, updatedRule) => {
    try {
      const token = localStorage.getItem('webwork_token');
      const response = await fetch(`/api/restrictions/rules/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedRule)
      });
      const data = await response.json();
      if (data.success) {
        setRules(rules.map(rule => rule.id === id ? data.data : rule));
      }
    } catch (error) {
      console.error('Error updating rule:', error);
    }
  };

  // Delete rule
  const deleteRule = async (id) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        const token = localStorage.getItem('webwork_token');
        const response = await fetch(`/api/restrictions/rules/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (data.success) {
          setRules(rules.filter(rule => rule.id !== id));
        }
      } catch (error) {
        console.error('Error deleting rule:', error);
      }
    }
  };

  // Toggle rule active status
  const toggleRule = async (rule) => {
    await updateRule(rule.id, { ...rule, isActive: !rule.isActive });
  };

  // Acknowledge violation
  const acknowledgeViolation = async (violationId) => {
    try {
      const token = localStorage.getItem('webwork_token');
      const response = await fetch(`/api/restrictions/violations/${violationId}/acknowledge`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setViolations(violations.map(v => v.id === violationId ? { ...v, status: 'acknowledged' } : v));
      }
    } catch (error) {
      console.error('Error acknowledging violation:', error);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-yellow-100 text-yellow-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800',
      critical: 'bg-red-200 text-red-900'
    };
    return colors[severity] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      acknowledged: 'bg-blue-100 text-blue-800',
      resolved: 'bg-gray-100 text-gray-800',
      overridden: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || colors.active;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Restriction Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage website restrictions and monitor violations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Add New Rule
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Rules</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{rules.length}</p>
            </div>
            <div className="text-2xl">📋</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Active Rules</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {rules.filter(r => r.isActive).length}
              </p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Violations</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{violations.length}</p>
            </div>
            <div className="text-2xl">🚫</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Active Violations</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {violations.filter(v => v.status === 'active').length}
              </p>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Restriction Rules</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Rule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {rule.name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {rule.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-800 dark:text-slate-100">
                      {rule.targetValue}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {rule.targetType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {rule.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(rule.severity)}`}>
                      {rule.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleRule(rule)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rule.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingRule(rule)}
                        className="text-primary hover:text-primary-dark"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Violations Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Recent Violations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Rule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {violations.slice(0, 10).map((violation) => (
                <tr key={violation.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-800 dark:text-slate-100">
                      {violation.user?.firstName} {violation.user?.lastName}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {violation.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-800 dark:text-slate-100">
                      {violation.targetDomain}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {violation.targetUrl}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-800 dark:text-slate-100">
                      {violation.rule?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(violation.severity)}`}>
                      {violation.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(violation.status)}`}>
                      {violation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {new Date(violation.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {violation.status === 'active' && (
                      <button
                        onClick={() => acknowledgeViolation(violation.id)}
                        className="text-primary hover:text-primary-dark"
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl mx-4">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Create New Restriction Rule
            </h3>
            <form onSubmit={createRule} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    value={newRule.name}
                    onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Target Type
                  </label>
                  <select
                    value={newRule.targetType}
                    onChange={(e) => setNewRule({...newRule, targetType: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="domain">Domain</option>
                    <option value="url">URL</option>
                    <option value="category">Category</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Target Value
                  </label>
                  <input
                    type="text"
                    value={newRule.targetValue}
                    onChange={(e) => setNewRule({...newRule, targetValue: e.target.value})}
                    placeholder="e.g., youtube.com"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Rule Type
                  </label>
                  <select
                    value={newRule.type}
                    onChange={(e) => setNewRule({...newRule, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="block">Block</option>
                    <option value="alert">Alert</option>
                    <option value="time_limit">Time Limit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Severity
                  </label>
                  <select
                    value={newRule.severity}
                    onChange={(e) => setNewRule({...newRule, severity: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Applies To
                  </label>
                  <select
                    value={newRule.appliesTo}
                    onChange={(e) => setNewRule({...newRule, appliesTo: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="all">All Users</option>
                    <option value="user">Specific User</option>
                    <option value="team">Team</option>
                    <option value="role">Role</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Alert Message
                </label>
                <input
                  type="text"
                  value={newRule.alertMessage}
                  onChange={(e) => setNewRule({...newRule, alertMessage: e.target.value})}
                  placeholder="Custom message shown to users"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestrictionManagement;

