import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

const variants = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40',
  secondary: 'border border-surface-border text-text-primary bg-white hover:bg-slate-50 disabled:opacity-40',
  ghost: 'text-text-secondary hover:bg-slate-100 disabled:opacity-40',
  danger: 'text-red-600 hover:bg-red-50 disabled:opacity-40',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
