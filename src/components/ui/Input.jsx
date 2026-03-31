export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-text-muted mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 bg-surface-light border rounded-lg text-text placeholder-text-muted/50
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors
          ${error ? 'border-danger' : 'border-surface-lighter'}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}
