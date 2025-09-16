import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import ChartCard from '../components/ChartCard.jsx';
import Loader from '../components/Loader.jsx';
import StatCard from '../components/StatCard.jsx';
import ScreenshotGallery from '../components/ScreenshotGallery.jsx';
import ActivityFeed from '../components/ActivityFeed.jsx';
import AppUsageCard from '../components/AppUsageCard.jsx';
import AttendanceList from '../components/AttendanceList.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Topbar from '../components/Topbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  activityApi,
  attendanceApi,
  screenshotApi,
  shiftApi,
  timeLogApi,
  userApi
} from '../services/api.js';

const AgentDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isManager = user.role === 'admin' || user.role === 'manager';
  const [agent, setAgent] = useState(null);
  const [timesheet, setTimesheet] = useState(null);
  const [period, setPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activitySummary, setActivitySummary] = useState(null);
  const [appUsage, setAppUsage] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [activities, setActivities] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [shifts, setShifts] = useState([]);

  const fetchData = useCallback(async () => {
    if (!isManager) return;
      setLoading(true);
      setError(null);
      try {
        const [agentRecord, sheet] = await Promise.all([
          userApi.get(id),
          timeLogApi.timesheet({ period, userId: id })
        ]);

        setAgent(agentRecord);
        setTimesheet(sheet);

        const filters = sheet
          ? { userId: id, from: sheet.startDate, to: sheet.endDate }
          : { userId: id };

        const [summary, appSummary, shots, activityList, attendanceRecords, shiftRecords] = await Promise.all([
          activityApi.summary(filters),
          activityApi.summaryByApp(filters),
          screenshotApi.list(filters),
          activityApi.list({ ...filters, limit: 20 }),
          attendanceApi.list(filters),
          shiftApi.list({ userId: id, from: filters.from })
        ]);

        setActivitySummary(summary);
        setAppUsage(appSummary);
        setScreenshots(shots);
        setActivities(activityList);
        setAttendance(attendanceRecords);
        setShifts(shiftRecords);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
  }, [id, isManager, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const timesheetSummary = useMemo(() => {
    if (!timesheet) return null;
    return {
      totalMinutes: timesheet.totalMinutes,
      startDate: timesheet.startDate,
      endDate: timesheet.endDate,
      totalsByDay: timesheet.totalsByDay
    };
  }, [timesheet]);

  if (!isManager) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout topbar={<Topbar title={agent ? `${agent.firstName} ${agent.lastName}` : 'Agent'} />}>
      {loading ? (
        <Loader message="Loading agent analytics" />
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Failed to load agent analytics. {error.response?.data?.message || error.message}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">
                {agent?.firstName} {agent?.lastName}
              </h2>
              <p className="text-sm text-slate-500">{agent?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {['daily', 'weekly', 'monthly'].map((option) => (
                <button
                  key={option}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    period === option
                      ? 'bg-primary text-white shadow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  onClick={() => setPeriod(option)}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Tracked minutes" value={timesheetSummary?.totalMinutes || 0} icon="⏱️" />
            <StatCard
              title="Period"
              value={timesheetSummary ? `${timesheetSummary.startDate.slice(0, 10)} → ${timesheetSummary.endDate.slice(0, 10)}` : '—'}
              icon="📅"
            />
            <StatCard
              title="Productive minutes"
              value={(activitySummary?.totalMinutes || 0) - (activitySummary?.idleMinutes || 0)}
              icon="⚡"
            />
            <StatCard
              title="Productivity score"
              value={`${Math.round((activitySummary?.productivityScore || 0) * 100)}%`}
              icon="📈"
            />
            <StatCard
              title="Keystrokes"
              value={activitySummary?.keyboardCount || 0}
              icon="⌨️"
            />
            <StatCard
              title="Mouse events"
              value={activitySummary?.mouseCount || 0}
              icon="🖱️"
            />
          </div>

          {timesheet && (
            <ChartCard
              title="Daily breakdown"
              subtitle="Minutes logged per day"
              data={timesheet.totalsByDay.map((item) => ({ label: item.date, minutes: item.minutes }))}
              dataKey="minutes"
              type="bar"
            />
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <AppUsageCard usage={appUsage} />
            <AttendanceList records={attendance.filter((record) => record.clockOut === null)} />
          </div>

          <ActivityFeed activities={activities} />

          <ScreenshotGallery
            screenshots={screenshots}
            canDelete
            onRefresh={fetchData}
            onDelete={async (screenshotId) => {
              await screenshotApi.remove(screenshotId);
              fetchData();
            }}
          />

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">Recent attendance</h3>
            {attendance.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No attendance records for the selected period.</p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {attendance.map((record) => (
                  <li key={record.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-800">
                        Clock-in {format(new Date(record.clockIn), 'PPpp')}
                      </p>
                      {record.clockOut && (
                        <p className="text-xs text-slate-500">Clock-out {format(new Date(record.clockOut), 'PPpp')}</p>
                      )}
                    </div>
                    <span className="text-xs uppercase text-slate-400">{record.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">Shifts</h3>
            {shifts.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No shifts scheduled during this period.</p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {shifts.map((shift) => (
                  <li key={shift.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-800">
                        {format(new Date(shift.startTime), 'PPpp')} → {format(new Date(shift.endTime), 'pp')}
                      </p>
                    </div>
                    <span className="text-xs uppercase text-slate-400">{shift.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AgentDetailPage;
