import { Bell, FileWarning, Hospital, House, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: 'Home', icon: House },
  { to: '/incidents', label: 'Incidents', icon: FileWarning },
  { to: '/hospitals', label: 'Hospitals', icon: Hospital },
  { to: '/notifications', label: 'Alerts', icon: Bell },
  { to: '/profile', label: 'Profile', icon: UserRound }
]

export default function BottomNavigation() {
  return <nav className="bottom-nav" aria-label="Mobile navigation">{items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'bottom-nav__item bottom-nav__item--active' : 'bottom-nav__item'}><Icon size={20} /><span>{label}</span></NavLink>)}</nav>
}
