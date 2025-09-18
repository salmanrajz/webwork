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
  <div className="col-span-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm transition-colors duration-300">
    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
    {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    <div className="mt-4 h-60">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-600" />
            <XAxis dataKey="label" stroke="#94a3b8" className="dark:stroke-slate-400" />
            <YAxis stroke="#94a3b8" className="dark:stroke-slate-400" />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }} 
              formatter={(value) => [`${value} min`, 'Minutes']}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#1e293b'
              }}
            />
            <Bar dataKey={dataKey} fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-600" />
            <XAxis dataKey="label" stroke="#94a3b8" className="dark:stroke-slate-400" />
            <YAxis stroke="#94a3b8" className="dark:stroke-slate-400" />
            <Tooltip 
              cursor={{ stroke: '#2563eb', strokeWidth: 2 }} 
              formatter={(value) => [`${value} min`, 'Minutes']}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#1e293b'
              }}
            />
            <Line type="monotone" dataKey={dataKey} stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  </div>
);

export default ChartCard;
