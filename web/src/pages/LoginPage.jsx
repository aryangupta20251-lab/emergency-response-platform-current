import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import Alert from '../components/Alert'
import Input from '../components/Input'
import Button from '../components/Button'
import AuthShell from '../components/AuthShell'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../context/AuthContext'

function getRoleHome(role) {
  if (role === 'admin') return '/admin'
  if (role === 'responder') return '/responder'
  return '/dashboard'
}

function getSafeRedirect(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null

  const destination = new URL(value, window.location.origin)
  if (destination.origin !== window.location.origin) return null
  return `${destination.pathname}${destination.search}${destination.hash}`
}

export default function LoginPage() {
  const { isAuthenticated, user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(
    () => sessionStorage.getItem('emergency-response-session-expired-notice') === 'true',
  )

  useEffect(() => {
    if (isAuthenticated) navigate(getRoleHome(user?.role), { replace: true })
  }, [isAuthenticated, navigate, user?.role])

  const redirect = getSafeRedirect(new URLSearchParams(location.search).get('redirect'))
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const authenticatedUser = await login(form, rememberMe)
      navigate(redirect || getRoleHome(authenticatedUser.role), { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  return <AuthShell><div className="auth-icon"><ShieldCheck size={24} /></div><h1>Welcome back</h1><p>Sign in to your Emergency Response account.</p>{sessionExpired && <Alert tone="info" title="Session expired">Your session has expired. Please log in again.</Alert>}{error && <Alert tone="error" title="Unable to sign in">{error}</Alert>}<form onSubmit={submit}><Input label="Email or phone" name="identifier" value={form.identifier} onChange={update} placeholder="you@example.com" autoComplete="username" required /><PasswordInput label="Password" name="password" value={form.password} onChange={update} placeholder="At least 6 characters" autoComplete="current-password" required /><div className="auth-row"><label><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /> Remember me</label><Link to="/forgot-password">Forgot password?</Link></div><Button type="submit" size="large" loading={loading}>Sign in</Button></form><div className="auth-demo">Use the email or phone number and password registered to your account.</div><div className="auth-footer">New here? <Link to="/register">Create an account</Link></div></AuthShell>
}
