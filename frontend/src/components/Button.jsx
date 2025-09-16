const baseClasses = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-200',
  ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-200'
};

const Button = ({ variant = 'primary', className = '', ...props }) => (
  <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props} />
);

export default Button;
