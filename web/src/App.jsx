import { BrowserRouter } from 'react-router-dom'
import { useEffect } from 'react'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { AccidentReportProvider } from './context/AccidentReportContext'
import { NotificationProvider } from './context/NotificationContext'
import { ContactsProvider } from './context/ContactsContext'
import { ResponderProvider } from './context/ResponderContext'
import { AdminManagementProvider } from './context/AdminManagementContext'
import AppErrorBoundary from './components/AppErrorBoundary'

const basename = import.meta.env.BASE_URL

const themeStorageKey = 'emergency-response-theme'
const accentStorageKey = 'emergency-response-accent'

const accentPalettes = {
  cyan: { primary: '#60a5fa', secondary: '#34d399', glow: 'rgba(96,165,250,0.38)' },
  violet: { primary: '#8b5cf6', secondary: '#22d3ee', glow: 'rgba(139,92,246,0.38)' },
  emerald: { primary: '#34d399', secondary: '#22c55e', glow: 'rgba(52,211,153,0.35)' },
  rose: { primary: '#fb7185', secondary: '#f59e0b', glow: 'rgba(251,113,133,0.35)' },
}

function ThemeBootstrap() {
  useEffect(() => {
    const updateTheme = () => {
      const savedTheme = localStorage.getItem(themeStorageKey) || 'system'
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const isDark = savedTheme === 'dark' || (savedTheme === 'system' && prefersDark)
      document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
    }

    const updateAccent = () => {
      const accentName = localStorage.getItem(accentStorageKey) || 'cyan'
      const palette = accentPalettes[accentName] || accentPalettes.cyan
      document.documentElement.style.setProperty('--color-primary', palette.primary)
      document.documentElement.style.setProperty('--color-secondary', palette.secondary)
      document.documentElement.style.setProperty('--shadow-button', `0 12px 24px ${palette.glow}`)
      document.documentElement.style.setProperty('--color-primary-soft', `${palette.primary}22`)
    }

    updateTheme()
    updateAccent()
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => updateTheme()
    mediaQuery.addEventListener?.('change', listener)
    window.addEventListener('storage', (event) => {
      if (event.key === themeStorageKey) updateTheme()
      if (event.key === accentStorageKey) updateAccent()
    })

    return () => mediaQuery.removeEventListener?.('change', listener)
  }, [])

  return null
}

export default function App() {
  return <AppErrorBoundary><ThemeBootstrap /><BrowserRouter basename={basename}><AuthProvider><NotificationProvider><ContactsProvider><ResponderProvider><AdminManagementProvider><AccidentReportProvider><AppRoutes /></AccidentReportProvider></AdminManagementProvider></ResponderProvider></ContactsProvider></NotificationProvider></AuthProvider></BrowserRouter></AppErrorBoundary>
}
