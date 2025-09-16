import { useEffect, useState } from 'react';
import { endOfDay, startOfDay, subHours } from 'date-fns';
import ChartCard from '../components/ChartCard.jsx';
import Loader from '../components/Loader.jsx';
import StatCard from '../components/StatCard.jsx';
import Topbar from '../components/Topbar.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import AttendanceList from '../components/AttendanceList.jsx';
import ActivityFeed from '../components/ActivityFeed.jsx';
import ShiftList from '../components/ShiftList.jsx';
import RealTimeBoard from '../components/RealTimeBoard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  activityApi,
  attendanceApi,
  dashboardApi,
  realtimeApi,
  shiftApi,
  timeLogApi
} from '../services/api.js';

const formatMinutes = (minutes = 0) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const DashboardPage = () => {
  const { user } = useAuth();
  const isManager = user.role === 'admin' || user.role === 'manager';
  const [adminMetrics, setAdminMetrics] = useState(null);
  const [timesheet, setTimesheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAttendance, setActiveAttendance] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [activitySummary, setActivitySummary] = useState(null);
  const [realtimeSnapshot, setRealtimeSnapshot] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const sheet = await timeLogApi.timesheet({ period: 'weekly' });
        setTimesheet(sheet);

        if (user.role === 'admin') {
          const metrics = await dashboardApi.admin();
          setAdminMetrics(metrics);
        }

       if (isManager) {
          const now = new Date();
          const [attendanceRecords, activityRecords, shifts, summary, realtime] = await Promise.all([
            attendanceApi.list({
              from: startOfDay(now).toISOString(),
              to: endOfDay(now).toISOString()
            }),
            activityApi.list({ from: subHours(now, 6).toISOString(), limit: 12 }),
            shiftApi.list({ from: now.toISOString(), limit: 10 }),
            sheet
              ? activityApi.summary({ from: sheet.startDate, to: sheet.endDate })
              : Promise.resolve(null),
            realtimeApi.overview()
          ]);

          setActiveAttendance(attendanceRecords.filter((record) => !record.clockOut));
          setRecentActivities(activityRecords);
          setUpcomingShifts(shifts.slice(0, 6));
          setActivitySummary(summary);
          setRealtimeSnapshot(realtime);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user.role, isManager]);

  useEffect(() => {
    if (!isManager) return;
    const interval = setInterval(async () => {
      try {
        const realtime = await realtimeApi.overview();
        setRealtimeSnapshot(realtime);
      } catch (err) {
        console.error('Failed to refresh realtime snapshot', err);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [isManager]);

  const renderStats = () => {
    const items = [];

    if (adminMetrics) {
      items.push(
        <StatCard key="users" title="Team members" value={adminMetrics.totals.users} icon="👥" />, 
        <StatCard key="teams" title="Teams" value={adminMetrics.totals.teams} icon="🧑‍🤝‍🧑" />,
        <StatCard key="projects" title="Projects" value={adminMetrics.totals.projects} icon="🗂️" />,
        <StatCard key="hours" title="Hours logged" value={adminMetrics.totals.totalHours} icon="⏱️" />
      );
    } else {
      items.push(
        <StatCard
          key="week"
          title="This week"
          value={formatMinutes(timesheet?.totalMinutes || 0)}
          icon="📅"
        />,
        <StatCard
          key="period"
          title="Active period"
          value={`${timesheet?.period ?? ''}`}
          icon="🕒"
        />
      );
    }

    if (activitySummary) {
      items.push(
        <StatCard
          key="prod-min"
          title="Productive minutes"
          value={activitySummary.totalMinutes - activitySummary.idleMinutes}
          icon="⚡"
        />,
        <StatCard
          key="idle-min"
          title="Idle minutes"
          value={activitySummary.idleMinutes}
          icon="💤"
        />,
        <StatCard
          key="prod-score"
          title="Productivity score"
          value={`${Math.round((activitySummary.productivityScore || 0) * 100)}%`}
          icon="📈"
        />
      );
    }

    return items;
  };

  const renderContent = () => {
    if (loading) return <Loader message="Loading dashboard" />;
    if (error)
      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Failed to load dashboard. {error.response?.data?.message || error.message}
        </div>
      );

    return (
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{renderStats()}</div>

        {realtimeSnapshot && <RealTimeBoard snapshot={realtimeSnapshot} />}

        {timesheet && (
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard
              title="Weekly hours"
              subtitle="Minutes logged per day"
              data={timesheet.totalsByDay.map((item) => ({ label: item.date, minutes: item.minutes }))}
              dataKey="minutes"
              type="line"
            />
            {adminMetrics ? (
              <ChartCard
                title="Top projects"
                subtitle="Hours logged by project"
                data={adminMetrics.topProjects.map((item) => ({
                  label: item.projectName,
                  minutes: Math.round(item.hours * 60)
                }))}
                dataKey="minutes"
                type="bar"
              />
            ) : (
              <ChartCard
                title="My productivity"
                subtitle="Weekly breakdown"
                data={timesheet.totalsByDay.map((item) => ({ label: item.date, minutes: item.minutes }))}
                dataKey="minutes"
                type="bar"
              />
            )}
          </div>
        )}

        {adminMetrics && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800">Top users</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {adminMetrics.topUsers.map((item) => (
                  <li key={item.userId} className="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3">
                    <span>{item.userName}</span>
                    <span className="font-medium text-slate-800">{item.hours}h</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800">Period summary</h3>
              <p className="mt-1 text-sm text-slate-500">
                {timesheet ? `${timesheet.startDate.slice(0, 10)} → ${timesheet.endDate.slice(0, 10)}` : '—'}
              </p>
              {timesheet && (
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {timesheet.totalsByDay.map((item) => (
                    <li key={item.date} className="flex items-center justify-between">
                      <span>{item.date}</span>
                      <span className="font-medium text-slate-800">{formatMinutes(item.minutes)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {isManager && (
          <div className="grid gap-6 lg:grid-cols-2">
            <AttendanceList records={activeAttendance} />
            <ShiftList shifts={upcomingShifts} />
          </div>
        )}

        {isManager && <ActivityFeed activities={recentActivities} />}
      </div>
    );
  };

  return (
    <DashboardLayout topbar={<Topbar title="Dashboard" />}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default DashboardPage;
