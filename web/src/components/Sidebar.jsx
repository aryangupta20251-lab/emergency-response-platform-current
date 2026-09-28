import { Bell, FileWarning, Hospital, House, LogOut, Settings, UserRound, UsersRound, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import BrandMark from './BrandMark'
import { useAuth } from '../context/AuthContext'

const items = [
  { to: '/dashboard', label: 'Home', icon: House },
  { to: '/incidents', label: 'Incidents', icon: FileWarning },
  { to: '/hospitals', label: 'Hospitals', icon: Hospital },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: Settings }
]

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const { logout } = useAuth()

  return (
    <>
      <aside className={`sidebar ${mobileOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__brand"><BrandMark compact /></div>
          <button type="button" className="icon-button icon-button--close" onClick={onClose} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>
        <nav className="sidebar__nav" aria-label="Main navigation">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer"><div className="demo-pill"><UsersRound size={15} /> Live account</div><span>Secure account access</span><button className="nav-item sidebar__logout" type="button" onClick={logout}><LogOut size={17} /><span>Sign out</span></button></div>
      </aside>
    </>
  )
}
