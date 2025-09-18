import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout.jsx';

const GpsDashboard = () => {
  const [view, setView] = useState('live'); // 'live', 'history', 'geofences'
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [livePositions, setLivePositions] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (view === 'live') {
      fetchLivePositions();
    } else if (view === 'history' && selectedUser && selectedDate) {
      fetchRouteHistory();
    } else if (view === 'geofences') {
      fetchGeofences();
    }
  }, [view, selectedUser, selectedDate]);

  const fetchLivePositions = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('webwork_token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch('/api/gps/live', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLivePositions(data.data || []);
        setError(null);
      } else if (response.status === 401) {
        setError('Session expired. Please log in again.');
        // Redirect to login
        window.location.href = '/login';
      } else if (response.status === 403) {
        setError('Access denied. You do not have permission to view GPS data.');
      } else if (response.status >= 500) {
        if (retryCount < 3) {
          console.log(`Retrying GPS fetch (attempt ${retryCount + 1})...`);
          setTimeout(() => fetchLivePositions(retryCount + 1), 2000);
          return;
        }
        setError('Server error. Please try again later.');
      } else {
        setError(`Failed to fetch live positions (${response.status})`);
      }
    } catch (err) {
      console.error('GPS fetch error:', err);
      if (retryCount < 3) {
        console.log(`Retrying GPS fetch due to network error (attempt ${retryCount + 1})...`);
        setTimeout(() => fetchLivePositions(retryCount + 1), 2000);
        return;
      }
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRouteHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/gps/routes?userId=${selectedUser}&date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('webwork_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRouteData(data.data);
      } else {
        // Mock data for demo
        setRouteData({
          points: [],
          stats: {
            totalDistance: 0,
            totalDuration: 0,
            averageSpeed: 0,
            pointCount: 0
          }
        });
      }
    } catch (err) {
      setError('Failed to fetch route history');
    } finally {
      setLoading(false);
    }
  };

  const fetchGeofences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gps/geofences', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('webwork_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeofences(data.data || []);
      } else {
        // Mock data for demo
        setGeofences([
          {
            id: '1',
            name: 'Office Building',
            description: 'Main office location',
            type: 'circle',
            autoClockIn: true,
            autoClockOut: false,
            blockOutsideClockIn: false
          },
          {
            id: '2',
            name: 'Client Site A',
            description: 'Client location for project work',
            type: 'polygon',
            autoClockIn: false,
            autoClockOut: true,
            blockOutsideClockIn: true
          }
        ]);
      }
    } catch (err) {
      setError('Failed to fetch geofences');
    } finally {
      setLoading(false);
    }
  };

  const renderLiveMap = () => (
    <div className="h-96 w-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Live GPS Map
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Map integration coming soon. Currently showing GPS data in table format below.
        </p>
      </div>
    </div>
  );

  const renderHistoryMap = () => (
    <div className="h-96 w-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Route History Map
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Interactive route visualization coming soon.
        </p>
      </div>
    </div>
  );

  const renderGeofencesMap = () => (
    <div className="h-96 w-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Geofence Management
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Visual geofence editor coming soon.
        </p>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            GPS Tracking Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor live locations, view route history, and manage geofences
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'live', name: 'Live Positions', icon: '📍' },
                { id: 'history', name: 'Route History', icon: '🗺️' },
                { id: 'geofences', name: 'Geofences', icon: '🔒' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    view === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Filters */}
        {view === 'history' && (
          <div className="mb-6 flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select user...</option>
                {/* Add user options here */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {loading && (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {view === 'live' && renderLiveMap()}
              {view === 'history' && renderHistoryMap()}
              {view === 'geofences' && renderGeofencesMap()}
            </>
          )}
        </div>

        {/* Live Positions Table */}
        {view === 'live' && livePositions.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Positions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Accuracy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Last Update
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {livePositions.map((position) => (
                    <tr key={position.userId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {position.user?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {position.user?.email || 'No email'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {position.accuracy ? `${Math.round(position.accuracy)}m` : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(position.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          position.isMoving 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {position.isMoving ? 'Moving' : 'Stationary'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Statistics */}
        {view === 'live' && livePositions.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Online Users</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {livePositions.length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Average Accuracy</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {Math.round(
                  livePositions.reduce((sum, pos) => sum + (pos.accuracy || 0), 0) / 
                  livePositions.length
                )}m
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Moving Users</h3>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {livePositions.filter(pos => pos.isMoving).length}
              </p>
            </div>
          </div>
        )}

        {/* Route Statistics */}
        {view === 'history' && routeData && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Distance</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {routeData.stats?.totalDistance || 0}m
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Duration</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {Math.round((routeData.stats?.totalDuration || 0) / 60)}min
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Avg Speed</h3>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {routeData.stats?.averageSpeed || 0}km/h
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Points</h3>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {routeData.stats?.pointCount || 0}
              </p>
            </div>
          </div>
        )}

        {/* Geofences List */}
        {view === 'geofences' && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Geofences</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium">
                  Create Geofence
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {geofences.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <div className="text-4xl mb-4">🔒</div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Geofences</h4>
                  <p className="text-gray-500 dark:text-gray-400">
                    Create your first geofence to start location-based tracking.
                  </p>
                </div>
              ) : (
                geofences.map((geofence) => (
                  <div key={geofence.id} className="px-6 py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {geofence.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {geofence.description}
                        </p>
                        <div className="mt-2 flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>Type: {geofence.type}</span>
                          {geofence.autoClockIn && <span>Auto Clock-in</span>}
                          {geofence.autoClockOut && <span>Auto Clock-out</span>}
                          {geofence.blockOutsideClockIn && <span>Block Outside</span>}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GpsDashboard;