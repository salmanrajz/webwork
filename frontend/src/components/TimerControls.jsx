import { useState } from 'react';
import Button from './Button.jsx';

const TimerControls = ({ tasks = [], activeLog, onStart, onStop, onPause, onResume, isProcessing }) => {
  const [selectedTask, setSelectedTask] = useState('');

  const handleStart = () => {
    if (!selectedTask) return;
    onStart(selectedTask);
  };

  const handleResume = () => {
    const taskId = activeLog?.task?.id || selectedTask;
    if (!taskId) return;
    onResume(taskId);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm transition-colors duration-300">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Timer</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Track your work in real-time. Select a task and start the timer.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          className="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300"
          value={selectedTask}
          onChange={(event) => setSelectedTask(event.target.value)}
          disabled={Boolean(activeLog) || isProcessing}
        >
          <option value="">Select a task</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title} ({task.project?.name})
            </option>
          ))}
        </select>
        {!activeLog ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleStart} disabled={!selectedTask || isProcessing}>
              Start
            </Button>
            <Button
              variant="secondary"
              onClick={handleResume}
              disabled={!selectedTask || isProcessing}
            >
              Resume
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onPause} disabled={isProcessing}>
              Pause
            </Button>
            <Button variant="secondary" onClick={onStop} disabled={isProcessing}>
              Stop
            </Button>
          </div>
        )}
      </div>
      {activeLog && (
        <div className="mt-4 rounded-md bg-slate-50 dark:bg-slate-700 p-4 text-sm text-slate-600 dark:text-slate-300 transition-colors duration-300">
          <div className="font-medium text-slate-800 dark:text-slate-100">Currently tracking:</div>
          <span className="block text-slate-500 dark:text-slate-400">{activeLog.task?.title}</span>
          <div className="mt-1 text-slate-500 dark:text-slate-400">
            Started at {new Date(activeLog.startTime).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerControls;
