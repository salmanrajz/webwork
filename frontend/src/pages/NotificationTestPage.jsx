import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Topbar from '../components/Topbar.jsx';
import NotificationExamples from '../components/NotificationExamples.jsx';

const NotificationTestPage = () => {
  return (
    <DashboardLayout topbar={<Topbar title="Notification Testing" />}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            🔔 Notification Testing
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Test and demonstrate the real-time notification system
          </p>
        </div>

        <NotificationExamples />
      </div>
    </DashboardLayout>
  );
};

export default NotificationTestPage;
