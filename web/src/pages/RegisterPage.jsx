import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Alert from '../components/Alert'
import Input from '../components/Input'
import Button from '../components/Button'
import AuthShell from '../components/AuthShell'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { isAuthenticated, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', identifier: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)
    try { await register(form); setSuccess(true); setTimeout(() => navigate('/dashboard', { replace: true }), 700) } catch (submitError) { setError(submitError.message) } finally { setLoading(false) }
  }

  return <AuthShell><h1>Create account</h1><p>Set up your citizen account.</p>{error && <Alert tone="error" title="Check your details">{error}</Alert>}{success && <Alert tone="success" title="Account created">Your account is ready. Redirecting to your dashboard.</Alert>}<form onSubmit={submit}><Input label="Full name" name="name" value={form.name} onChange={update} placeholder="Aryan Gupta" autoComplete="name" required /><Input label="Email or phone" name="identifier" value={form.identifier} onChange={update} placeholder="you@example.com" autoComplete="username" required /><PasswordInput label="Password" name="password" value={form.password} onChange={update} placeholder="At least 6 characters" autoComplete="new-password" required /><PasswordInput label="Confirm password" name="confirmPassword" value={form.confirmPassword} onChange={update} placeholder="Repeat your password" autoComplete="new-password" required /><Button type="submit" size="large" loading={loading}>Create account</Button></form><div className="auth-demo">Your account is stored securely by the backend.</div><div className="auth-footer">Already registered? <Link to="/login">Sign in</Link></div></AuthShell>
}
