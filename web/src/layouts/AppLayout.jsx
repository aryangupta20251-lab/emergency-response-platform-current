import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import BottomNavigation from '../components/BottomNavigation'

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="app-shell">
      <div
        className={`mobile-nav-backdrop ${mobileNavOpen ? 'mobile-nav-backdrop--open' : ''}`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="app-main">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="app-page-shell">
          <Outlet />
        </main>
      </div>
      <BottomNavigation />
    </div>
  )
}
