import express from 'express';
import gpsController from '../controllers/gpsController.js';
import geofenceController from '../controllers/geofenceController.js';
import { authenticate as auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// GPS Points Routes
router.post('/points', auth, gpsController.batchIngestPoints);
router.get('/live', auth, gpsController.getLivePositions);
router.get('/routes', auth, gpsController.getRouteHistory);
router.get('/events', auth, gpsController.getGpsEvents);
router.get('/export', auth, gpsController.exportGpsData);

// Geofence Routes
router.post('/geofences', auth, geofenceController.createGeofence);
router.get('/geofences', auth, geofenceController.getGeofences);
router.get('/geofences/:id', auth, geofenceController.getGeofenceById);
router.put('/geofences/:id', auth, geofenceController.updateGeofence);
router.delete('/geofences/:id', auth, geofenceController.deleteGeofence);
router.post('/geofences/:id/test', auth, geofenceController.testGeofence);
router.get('/geofences/:id/stats', auth, geofenceController.getGeofenceStats);

export default router;
