import { Bell, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import BrandMark from './BrandMark'

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar__mobile-brand"><BrandMark compact /></div>
      <div className="topbar__location"><MapPin size={17} /><span>Sector 12, Chandigarh</span></div>
      <div className="topbar__actions"><Link to="/notifications" className="icon-button" aria-label="Notifications"><Bell size={19} /><span className="notification-dot" /></Link><Link to="/profile" className="avatar">AG</Link></div>
    </header>
  )
}
