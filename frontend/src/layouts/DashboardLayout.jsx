import Sidebar from '../components/Sidebar.jsx';

const DashboardLayout = ({ children, topbar }) => (
  <div className="flex min-h-screen bg-slate-100">
    <Sidebar />
    <div className="flex flex-1 flex-col">
      {topbar}
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  </div>
);

export default DashboardLayout;
