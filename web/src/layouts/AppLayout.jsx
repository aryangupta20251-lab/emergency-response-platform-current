import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import BottomNavigation from '../components/BottomNavigation'

export default function AppLayout() {
  return <div className="app-shell"><Sidebar /><div className="app-main"><Topbar /><main><Outlet /></main></div><BottomNavigation /></div>
}
