const baseClasses = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
  secondary: 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 focus:ring-slate-200 dark:focus:ring-slate-400',
  ghost: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-slate-200 dark:focus:ring-slate-400'
};

const Button = ({ variant = 'primary', className = '', ...props }) => (
  <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props} />
);

export default Button;
