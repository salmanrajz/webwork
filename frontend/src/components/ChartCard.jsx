import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar
} from 'recharts';

const ChartCard = ({ title, subtitle, data = [], dataKey = 'minutes', type = 'line' }) => (
  <div className="col-span-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    <div className="mt-4 h-60">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value) => [`${value} min`, 'Minutes']} />
            <Bar dataKey={dataKey} fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip cursor={{ stroke: '#2563eb', strokeWidth: 2 }} formatter={(value) => [`${value} min`, 'Minutes']} />
            <Line type="monotone" dataKey={dataKey} stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  </div>
);

export default ChartCard;
