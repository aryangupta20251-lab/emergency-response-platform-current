import { Bell, CheckCheck, ChevronRight, Info, MessageSquare, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { useNotifications } from '../context/NotificationContext'

const icons = {
  info: Info,
  contact: UserRound,
  incident: MessageSquare,
  incident_created: MessageSquare,
  incident_received: MessageSquare,
  incident_verified: MessageSquare,
  responder_assigned: MessageSquare,
  responder_en_route: MessageSquare,
  responder_arrived: MessageSquare,
  incident_resolved: CheckCheck,
  incident_cancelled: Info,
  system: Info,
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, loading, error, realtimeConnected } = useNotifications()
  const unread = notifications.filter((item) => !item.read).length
  return (
    <div className="page-content notifications-page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><Bell size={14} /> Updates</span>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Incident and account updates from the platform.</p>
        </div>
        {unreadCount > 0 && <Button variant="secondary" onClick={markAllRead}><CheckCheck size={16} /> Mark all read</Button>}
      </div>
      <div className="dashboard-demo-note">
        <span className={`status-dot ${realtimeConnected ? 'status-dot--success' : 'status-dot--info'}`} />
        <span>{realtimeConnected ? 'Live updates connected' : 'Saved in-app updates'}</span>
        <small>Notifications are stored in your account. Push notifications are not configured.</small>
      </div>
      {error && <Alert tone="error" title="Could not load notifications">{error}</Alert>}
      {loading ? <Card role="status">Loading notifications…</Card> : notifications.length ? (
        <div className="notification-list">
          {notifications.map((notification) => <NotificationRow key={notification.id} notification={notification} onRead={markRead} />)}
        </div>
      ) : (
        <Card className="notification-empty">
          <div className="placeholder-page__icon"><Bell size={26} /></div>
          <h2>No notifications</h2>
          <p>{unread ? `${unread} unread notifications.` : 'You are all caught up.'}</p>
        </Card>
      )}
    </div>
  )
}

function NotificationRow({ notification, onRead }) {
  const Icon = icons[notification.type] || Bell
  return <Card className={`notification-row ${notification.read ? 'notification-row--read' : ''}`}>
    <span className="notification-row__icon"><Icon size={18} /></span>
    <div className="notification-row__body">
      <div className="notification-row__heading"><h2>{notification.title}</h2>{!notification.read && <span className="unread-dot" aria-label="Unread" />}</div>
      <p>{notification.detail}</p>
      <small>{notification.time}</small>
    </div>
    <Link className="icon-button notification-row__link" to={`/notifications/${notification.id}`} onClick={() => onRead(notification.id)} aria-label={`View ${notification.title}`}><ChevronRight size={17} /></Link>
  </Card>
}