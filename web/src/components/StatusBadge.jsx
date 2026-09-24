const toneMap = {
  Emergency: 'emergency',
  Warning: 'warning',
  Success: 'success',
  Info: 'info',
  Reported: 'info',
  Received: 'info',
  Verified: 'success',
  'Responder Assigned': 'info',
  Responding: 'warning',
  Arrived: 'success',
  Resolved: 'success',
  Cancelled: 'emergency'
}

export default function StatusBadge({ label }) {
  const tone = toneMap[label] || 'info'
  return <span className={`status-badge status-badge--${tone}`}><span className="status-dot" />{label}</span>
}
