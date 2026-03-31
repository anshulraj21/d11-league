const variants = {
  default: 'bg-surface-lighter text-text-muted',
  primary: 'bg-primary/20 text-primary-light',
  success: 'bg-success/20 text-success',
  danger: 'bg-danger/20 text-danger',
  accent: 'bg-accent/20 text-accent',
}

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
