/**
 * Compute effective match status.
 * If a match is "open" but its date is in the past, it becomes "closed".
 */
export function getEffectiveStatus(match) {
  if (!match) return 'open'
  if (match.status !== 'open') return match.status

  const today = new Date().toISOString().split('T')[0]
  if (match.date && match.date < today) return 'closed'
  return 'open'
}

/**
 * Get display properties for a match status.
 */
export function getStatusBadge(status) {
  switch (status) {
    case 'settled': return { variant: 'success', label: 'settled' }
    case 'completed': return { variant: 'accent', label: 'completed' }
    case 'closed': return { variant: 'danger', label: 'closed' }
    case 'live': return { variant: 'danger', label: 'LIVE' }
    default: return { variant: 'primary', label: 'open' }
  }
}
