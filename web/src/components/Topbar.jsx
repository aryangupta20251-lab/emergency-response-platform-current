import { Bell, LogOut, MapPin, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import BrandMark from './BrandMark'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'

export default function Topbar({ onOpenMobileNav }) {
  const { logout } = useAuth()
  const { unreadCount } = useNotifications()
  return (
    <header className="topbar">
      <div className="topbar__mobile-brand"><button type="button" className="icon-button icon-button--menu" aria-label="Open navigation" onClick={onOpenMobileNav}><Menu size={18} /></button><BrandMark compact /></div>
      <div className="topbar__location"><MapPin size={17} /><span>Sector 12, Chandigarh</span></div>
      <div className="topbar__actions"><Link to="/notifications" className="icon-button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}><Bell size={19} /><span className={unreadCount ? 'notification-count' : 'notification-count notification-count--empty'}>{unreadCount > 99 ? '99+' : unreadCount}</span></Link><Link to="/profile" className="avatar">AG</Link><button type="button" className="icon-button" onClick={logout} aria-label="Sign out"><LogOut size={18} /></button></div>
    </header>
  )
}
