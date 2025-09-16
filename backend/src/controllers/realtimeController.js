import { getRealtimeSnapshot } from '../services/realtimeService.js';

export const getRealtimeOverview = async (_req, res) => {
  const snapshot = await getRealtimeSnapshot();
  res.json({ success: true, data: snapshot });
};
