import { ArrowLeft, Bell, CheckCircle2 } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import Alert from '../components/Alert'
import Card from '../components/Card'
import { useNotifications } from '../context/NotificationContext'

export default function NotificationDetailPage() {
  const { notificationId } = useParams()
  const { notifications, markRead, loading, error } = useNotifications()
  const notification = notifications.find((item) => item.id === notificationId)
  useEffect(() => { if (notification && !notification.read) markRead(notification.id) }, [markRead, notification])
  if (loading) return <div className="page-content" role="status">Loading notification…</div>
  if (!notification) return error ? <div className="page-content"><Alert tone="error" title="Could not load notification">{error}</Alert><Link className="btn btn--ghost" to="/notifications">Return to notifications</Link></div> : <Navigate to="/notifications" replace />
  return <div className="page-content notification-detail-page"><Link className="report-back" to="/notifications"><ArrowLeft size={16} /> Back to notifications</Link><Card className="notification-detail-card"><div className="notification-detail-card__icon"><Bell size={25} /></div><span className="eyebrow">Platform notification</span><h1 className="page-title">{notification.title}</h1><p className="notification-detail-time">{notification.time}</p><p className="notification-detail-copy">{notification.detail}</p><Alert tone="info" title="Coordination update">This in-app update does not confirm that emergency services have been contacted or dispatched.</Alert><div className="notification-read-state"><CheckCircle2 size={16} /> Marked as read</div><Link className="btn btn--ghost" to="/notifications">Return to notifications</Link></Card></div>
}