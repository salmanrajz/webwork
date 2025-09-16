import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import StatCard from '../components/StatCard.jsx';
import TimeLogTable from '../components/TimeLogTable.jsx';
import TimerControls from '../components/TimerControls.jsx';
import Topbar from '../components/Topbar.jsx';
import ScreenshotGallery from '../components/ScreenshotGallery.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { screenshotApi, taskApi, timeLogApi, userApi } from '../services/api.js';

const TimesheetPage = () => {
  const { user } = useAuth();
  const canViewAll = user.role !== 'employee';
  const [period, setPeriod] = useState('weekly');
  const [selectedUser, setSelectedUser] = useState(user.id);
  const [members, setMembers] = useState([]);
  const [timesheet, setTimesheet] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeLog, setActiveLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [isLoadingShots, setIsLoadingShots] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      if (!canViewAll) return;
      try {
        const { users: data } = await userApi.list({ limit: 100 });
        setMembers(data);
      } catch (err) {
        console.error('Failed to load members', err);
      }
    };

    loadMembers();
  }, [canViewAll]);

  const loadTimesheet = async () => {
    setLoading(true);
    setError(null);
    try {
      const sheet = await timeLogApi.timesheet({ period, userId: selectedUser });
      setTimesheet(sheet);
      const taskList = await taskApi.list(
        canViewAll ? { assigneeId: selectedUser } : { assigneeId: user.id }
      );
      setTasks(taskList);
      await loadScreenshots(sheet);
      if (selectedUser === user.id) {
        const active = await timeLogApi.active();
        setActiveLog(active);
      } else {
        setActiveLog(null);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadScreenshots = async (sheet) => {
    setIsLoadingShots(true);
    try {
      const activeSheet = sheet || timesheet;
      const params = {
        userId: selectedUser,
        from: activeSheet?.startDate,
        to: activeSheet?.endDate
      };
      const data = await screenshotApi.list(params);
      setScreenshots(data);
    } catch (err) {
      console.error('Failed to load screenshots', err);
    } finally {
      setIsLoadingShots(false);
    }
  };

  useEffect(() => {
    loadTimesheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedUser]);

  const handleTimerAction = async (action, taskId) => {
    setIsProcessing(true);
    try {
      switch (action) {
        case 'start':
          await timeLogApi.start(taskId);
          break;
        case 'pause':
          await timeLogApi.pause();
          break;
        case 'stop':
          await timeLogApi.stop();
          break;
        case 'resume':
          await timeLogApi.resume(taskId);
          break;
        default:
          break;
      }
      const active = await timeLogApi.active();
      setActiveLog(active);
      await loadTimesheet();
    } catch (err) {
      setError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalHours = timesheet ? Math.round((timesheet.totalMinutes / 60) * 100) / 100 : 0;

  const periodOptions = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' }
  ];

  return (
    <DashboardLayout topbar={<Topbar title="Timesheets" />}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {periodOptions.map((option) => (
              <Button
                key={option.key}
                variant={period === option.key ? 'primary' : 'secondary'}
                onClick={() => setPeriod(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          {canViewAll && (
            <select
              value={selectedUser}
              onChange={(event) => setSelectedUser(event.target.value)}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value={user.id}>My timesheet</option>
              {members
                .filter((member) => member.id !== user.id)
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
            </select>
          )}
        </div>

        {loading ? (
          <Loader message="Loading timesheet" />
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            Failed to load timesheet. {error.response?.data?.message || error.message}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total minutes" value={timesheet.totalMinutes} icon="⏱️" />
              <StatCard title="Total hours" value={totalHours} icon="🕒" />
              <StatCard
                title="Period"
                value={`${timesheet.startDate.slice(0, 10)} → ${timesheet.endDate.slice(0, 10)}`}
                icon="📅"
              />
            </div>

            {selectedUser === user.id && (
              <TimerControls
                tasks={tasks}
                activeLog={activeLog}
                onStart={(taskId) => handleTimerAction('start', taskId)}
                onPause={() => handleTimerAction('pause')}
                onStop={() => handleTimerAction('stop')}
                onResume={(taskId) => handleTimerAction('resume', taskId)}
                isProcessing={isProcessing}
              />
            )}

            <TimeLogTable logs={timesheet.logs || []} />
            <div>
              {isLoadingShots ? (
                <Loader message="Loading screenshots" />
              ) : (
                <ScreenshotGallery
                  screenshots={screenshots}
                  onRefresh={() => loadScreenshots(timesheet)}
                  canDelete={canViewAll}
                  onDelete={async (id) => {
                    if (!canViewAll) return;
                    try {
                      await screenshotApi.remove(id);
                      loadScreenshots(timesheet);
                    } catch (err) {
                      console.error('Failed to delete screenshot', err);
                    }
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TimesheetPage;
