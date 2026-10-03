import { Activity, Bell, LayoutDashboard, LogOut, Settings, ShieldCheck } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const items = [
  { to: '/responder', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings }
]

export default function ResponderLayout() {
  const { logout } = useAuth()
  return <div className="responder-shell"><aside className="responder-sidebar"><div className="responder-brand"><span><ShieldCheck size={22} /></span><div><strong>Response Desk</strong><small>Responder workspace</small></div></div><nav className="responder-nav" aria-label="Responder navigation">{items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `responder-nav__item ${isActive ? 'responder-nav__item--active' : ''}`}><Icon size={18} /><span>{label}</span></NavLink>)}</nav><button type="button" className="responder-signout" onClick={logout}><LogOut size={17} /> Sign out</button></aside><div className="responder-main"><header className="responder-topbar"><div><span className="responder-mobile-title"><Activity size={17} /> Response Desk</span><span className="responder-topbar-location">Backend profile · Platform workflow only</span></div></header><main><Outlet /></main></div></div>
}