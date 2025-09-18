import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Polygon, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const GeofenceManager = ({ onGeofenceCreated, onGeofenceUpdated, onGeofenceDeleted }) => {
  const [geofences, setGeofences] = useState([]);
  const [selectedGeofence, setSelectedGeofence] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [geofenceType, setGeofenceType] = useState('circle');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    radius: 100,
    centerLat: 0,
    centerLng: 0,
    polygonPoints: [],
    autoClockIn: false,
    autoClockOut: false,
    blockOutsideClockIn: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGeofences();
  }, []);

  const fetchGeofences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gps/geofences', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeofences(data.data || []);
      }
    } catch (err) {
      setError('Failed to fetch geofences');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGeofence = async () => {
    try {
      setLoading(true);
      const geofenceData = {
        name: formData.name,
        description: formData.description,
        type: geofenceType,
        autoClockIn: formData.autoClockIn,
        autoClockOut: formData.autoClockOut,
        blockOutsideClockIn: formData.blockOutsideClockIn
      };

      if (geofenceType === 'circle') {
        geofenceData.centerLatitude = formData.centerLat;
        geofenceData.centerLongitude = formData.centerLng;
        geofenceData.radius = formData.radius;
      } else if (geofenceType === 'polygon') {
        geofenceData.polygonData = {
          type: 'Polygon',
          coordinates: [formData.polygonPoints.map(point => [point.lng, point.lat])]
        };
      }

      const response = await fetch('/api/gps/geofences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(geofenceData)
      });

      if (response.ok) {
        const data = await response.json();
        setGeofences([...geofences, data.data]);
        setIsCreating(false);
        resetForm();
        if (onGeofenceCreated) onGeofenceCreated(data.data);
      }
    } catch (err) {
      setError('Failed to create geofence');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGeofence = async () => {
    try {
      setLoading(true);
      const geofenceData = {
        name: formData.name,
        description: formData.description,
        autoClockIn: formData.autoClockIn,
        autoClockOut: formData.autoClockOut,
        blockOutsideClockIn: formData.blockOutsideClockIn
      };

      if (geofenceType === 'circle') {
        geofenceData.centerLatitude = formData.centerLat;
        geofenceData.centerLongitude = formData.centerLng;
        geofenceData.radius = formData.radius;
      } else if (geofenceType === 'polygon') {
        geofenceData.polygonData = {
          type: 'Polygon',
          coordinates: [formData.polygonPoints.map(point => [point.lng, point.lat])]
        };
      }

      const response = await fetch(`/api/gps/geofences/${selectedGeofence.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(geofenceData)
      });

      if (response.ok) {
        const data = await response.json();
        setGeofences(geofences.map(g => g.id === selectedGeofence.id ? data.data : g));
        setSelectedGeofence(null);
        resetForm();
        if (onGeofenceUpdated) onGeofenceUpdated(data.data);
      }
    } catch (err) {
      setError('Failed to update geofence');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGeofence = async (geofenceId) => {
    if (!confirm('Are you sure you want to delete this geofence?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/gps/geofences/${geofenceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setGeofences(geofences.filter(g => g.id !== geofenceId));
        if (onGeofenceDeleted) onGeofenceDeleted(geofenceId);
      }
    } catch (err) {
      setError('Failed to delete geofence');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      radius: 100,
      centerLat: 0,
      centerLng: 0,
      polygonPoints: [],
      autoClockIn: false,
      autoClockOut: false,
      blockOutsideClockIn: false
    });
  };

  const handleEditGeofence = (geofence) => {
    setSelectedGeofence(geofence);
    setGeofenceType(geofence.type);
    setFormData({
      name: geofence.name,
      description: geofence.description || '',
      radius: geofence.radius || 100,
      centerLat: geofence.centerLatitude || 0,
      centerLng: geofence.centerLongitude || 0,
      polygonPoints: geofence.polygonData ? 
        geofence.polygonData.coordinates[0].map(coord => ({ lat: coord[1], lng: coord[0] })) : [],
      autoClockIn: geofence.autoClockIn || false,
      autoClockOut: geofence.autoClockOut || false,
      blockOutsideClockIn: geofence.blockOutsideClockIn || false
    });
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        if (isCreating || selectedGeofence) {
          if (geofenceType === 'circle') {
            setFormData({
              ...formData,
              centerLat: e.latlng.lat,
              centerLng: e.latlng.lng
            });
          } else if (geofenceType === 'polygon') {
            setFormData({
              ...formData,
              polygonPoints: [...formData.polygonPoints, { lat: e.latlng.lat, lng: e.latlng.lng }]
            });
          }
        }
      }
    });
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Geofence Management</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          Create Geofence
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Form Modal */}
      {(isCreating || selectedGeofence) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {isCreating ? 'Create Geofence' : 'Edit Geofence'}
            </h3>

            <div className="space-y-4">
              {/* Geofence Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Geofence Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="circle"
                      checked={geofenceType === 'circle'}
                      onChange={(e) => setGeofenceType(e.target.value)}
                      className="mr-2"
                    />
                    Circle
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="polygon"
                      checked={geofenceType === 'polygon'}
                      onChange={(e) => setGeofenceType(e.target.value)}
                      className="mr-2"
                    />
                    Polygon
                  </label>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>

              {/* Circle-specific fields */}
              {geofenceType === 'circle' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Radius (meters)
                  </label>
                  <input
                    type="number"
                    value={formData.radius}
                    onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    min="1"
                  />
                </div>
              )}

              {/* Polygon instructions */}
              {geofenceType === 'polygon' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    Click on the map to add polygon points. Click the first point again to close the polygon.
                  </p>
                  <p className="text-blue-800 dark:text-blue-200 text-sm mt-1">
                    Points: {formData.polygonPoints.length}
                  </p>
                </div>
              )}

              {/* Auto actions */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.autoClockIn}
                    onChange={(e) => setFormData({ ...formData, autoClockIn: e.target.checked })}
                    className="mr-2"
                  />
                  Auto clock-in when entering geofence
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.autoClockOut}
                    onChange={(e) => setFormData({ ...formData, autoClockOut: e.target.checked })}
                    className="mr-2"
                  />
                  Auto clock-out when exiting geofence
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.blockOutsideClockIn}
                    onChange={(e) => setFormData({ ...formData, blockOutsideClockIn: e.target.checked })}
                    className="mr-2"
                  />
                  Block clock-in outside geofence
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setSelectedGeofence(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={isCreating ? handleCreateGeofence : handleUpdateGeofence}
                disabled={loading || !formData.name}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium"
              >
                {loading ? 'Saving...' : (isCreating ? 'Create' : 'Update')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="h-96 w-full">
          <MapContainer
            center={[40.7128, -74.0060]}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <MapClickHandler />
            
            {/* Existing geofences */}
            {geofences.map((geofence) => {
              if (geofence.type === 'circle') {
                return (
                  <Circle
                    key={geofence.id}
                    center={[geofence.centerLatitude, geofence.centerLongitude]}
                    radius={geofence.radius}
                    color="red"
                    fillColor="red"
                    fillOpacity={0.2}
                  />
                );
              } else if (geofence.type === 'polygon' && geofence.polygonData) {
                const coordinates = geofence.polygonData.coordinates[0].map(coord => [coord[1], coord[0]]);
                return (
                  <Polygon
                    key={geofence.id}
                    positions={coordinates}
                    color="red"
                    fillColor="red"
                    fillOpacity={0.2}
                  />
                );
              }
              return null;
            })}

            {/* Preview circle */}
            {isCreating && geofenceType === 'circle' && formData.centerLat !== 0 && (
              <Circle
                center={[formData.centerLat, formData.centerLng]}
                radius={formData.radius}
                color="blue"
                fillColor="blue"
                fillOpacity={0.2}
              />
            )}

            {/* Preview polygon */}
            {isCreating && geofenceType === 'polygon' && formData.polygonPoints.length > 0 && (
              <Polygon
                positions={formData.polygonPoints.map(point => [point.lat, point.lng])}
                color="blue"
                fillColor="blue"
                fillOpacity={0.2}
              />
            )}
          </MapContainer>
        </div>
      </div>

      {/* Geofences List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Geofences</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {geofences.map((geofence) => (
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
                  <button
                    onClick={() => handleEditGeofence(geofence)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteGeofence(geofence.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GeofenceManager;
