import { Activity, BarChart3, Bell, ClipboardCheck, ClipboardList, FileOutput, Hospital, LayoutDashboard, LogOut, Settings, ShieldCheck, UsersRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const items = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/incidents', label: 'Incidents', icon: ClipboardList },
  { to: '/admin/responders', label: 'Responders', icon: UsersRound },
  { to: '/admin/hospitals', label: 'Hospitals', icon: Hospital },
  { to: '/admin/users', label: 'Users', icon: UsersRound },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/audit-log', label: 'Audit log', icon: ClipboardCheck },
  { to: '/admin/reports', label: 'Reports', icon: FileOutput },
  { to: '/notifications', label: 'Activity', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings }
]

export default function AdminLayout() {
  const { logout } = useAuth()
  return <div className="admin-shell"><aside className="admin-sidebar"><div className="admin-brand"><span><ShieldCheck size={22} /></span><div><strong>Control Center</strong><small>Administrator workspace</small></div></div><nav className="admin-nav" aria-label="Admin navigation">{items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `admin-nav__item ${isActive ? 'admin-nav__item--active' : ''}`}><Icon size={18} /><span>{label}</span></NavLink>)}</nav><button type="button" className="admin-signout" onClick={logout}><LogOut size={17} /> Sign out</button></aside><div className="admin-main"><header className="admin-topbar"><div><span className="admin-mobile-title"><Activity size={17} /> Control Center</span><span className="admin-topbar-location">Backend records · coordination only</span></div></header><main><Outlet /></main></div></div>
}