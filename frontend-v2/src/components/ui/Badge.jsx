import { cn, getStatusColor } from '../../lib/utils';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  status,
  className,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    danger: 'bg-danger-100 text-danger-800',
    outline: 'border border-gray-300 text-gray-700 bg-white',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const statusClasses = status ? getStatusColor(status) : '';

  return (
    <span
      className={cn(
        baseClasses,
        status ? statusClasses : variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
