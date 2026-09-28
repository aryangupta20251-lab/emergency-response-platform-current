import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { AccidentReportProvider } from './context/AccidentReportContext'
import { NotificationProvider } from './context/NotificationContext'
import { ContactsProvider } from './context/ContactsContext'
import { ResponderProvider } from './context/ResponderContext'
import { AdminManagementProvider } from './context/AdminManagementContext'
import AppErrorBoundary from './components/AppErrorBoundary'

const basename = import.meta.env.PROD ? '/emergency-response-platform' : '/'

export default function App() {
  return <AppErrorBoundary><BrowserRouter basename={basename}><AuthProvider><NotificationProvider><ContactsProvider><ResponderProvider><AdminManagementProvider><AccidentReportProvider><AppRoutes /></AccidentReportProvider></AdminManagementProvider></ResponderProvider></ContactsProvider></NotificationProvider></AuthProvider></BrowserRouter></AppErrorBoundary>
}
