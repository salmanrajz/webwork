const Loader = ({ message = 'Loading...' }) => (
  <div className="flex w-full items-center justify-center py-20 text-slate-500">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    <span className="ml-3 text-sm font-medium">{message}</span>
  </div>
);

export default Loader;
