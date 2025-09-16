import { useAuth } from '../context/AuthContext.jsx';

const Topbar = ({ title, actions }) => {
  const { user } = useAuth();
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
        <p className="text-sm text-slate-500">Logged in as {user?.role?.toUpperCase()}</p>
      </div>
      <div className="flex items-center gap-3">{actions}</div>
    </header>
  );
};

export default Topbar;
