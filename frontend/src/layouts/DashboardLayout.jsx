import Sidebar from '../components/Sidebar.jsx';

const DashboardLayout = ({ children, topbar }) => (
  <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
    <Sidebar />
    <div className="flex flex-1 flex-col">
      {topbar}
      <main className="flex-1 px-8 py-6 bg-slate-50 dark:bg-slate-800 transition-colors duration-300">{children}</main>
    </div>
  </div>
);

export default DashboardLayout;
