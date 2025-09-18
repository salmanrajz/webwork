import { format } from 'date-fns';
import Button from './Button.jsx';

const ScreenshotGallery = ({ screenshots = [], onRefresh, onDelete, canDelete = false }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm transition-colors duration-300">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Screenshots</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Automatic captures linked to running timers. Click to view in full size.
        </p>
      </div>
      {onRefresh && (
        <Button variant="secondary" onClick={onRefresh}>
          Refresh
        </Button>
      )}
    </div>
    {screenshots.length === 0 ? (
      <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-10 text-center text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">
        No screenshots available for the selected filters.
      </div>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {screenshots.map((shot) => (
          <div key={shot.id} className="group relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-900/80 transition-colors duration-300">
            <a href={`/uploads/${shot.imagePath}`} target="_blank" rel="noreferrer">
              <img
                src={`/uploads/${shot.imagePath}`}
                alt={shot.note || 'Screenshot'}
                className="h-48 w-full object-cover opacity-90 transition group-hover:opacity-100"
                loading="lazy"
              />
            </a>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-4 text-sm text-white">
              <div className="font-semibold">
                {format(new Date(shot.capturedAt), 'PPpp')}
              </div>
              {shot.task && <div className="text-xs text-slate-200">Task: {shot.task.title}</div>}
              {shot.note && <div className="mt-1 text-xs text-slate-200/90">{shot.note}</div>}
            </div>
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(shot.id)}
                className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-rose-600 shadow transition hover:bg-white"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default ScreenshotGallery;
