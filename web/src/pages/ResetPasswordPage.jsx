import { LockKeyhole } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Alert from '../components/Alert'
import AuthShell from '../components/AuthShell'
import Button from '../components/Button'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../context/AuthContext'

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true)
    try { await resetPassword({ ...form, token }); setSuccess(true) } catch (submitError) { setError(submitError.message) } finally { setLoading(false) }
  }

  useEffect(() => {
    if (success) {
      const timer = window.setTimeout(() => navigate('/login'), 1200)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [navigate, success])

  return <AuthShell backTo="/forgot-password" backLabel="Back to password help"><div className="auth-icon"><LockKeyhole size={24} /></div><h1>Choose a new password</h1><p>The reset link is single-use and expires after 30 minutes.</p>{error && <Alert tone="error" title="Password reset failed">{error}</Alert>}{success && <Alert tone="success" title="Password updated">Your password was changed. Redirecting to sign in.</Alert>}{!token && <Alert tone="warning" title="Reset link required">Open the password reset link sent for your account.</Alert>}{!success && <form onSubmit={submit}><PasswordInput label="New password" name="password" value={form.password} onChange={update} placeholder="At least 6 characters" autoComplete="new-password" required /><PasswordInput label="Confirm password" name="confirmPassword" value={form.confirmPassword} onChange={update} placeholder="Repeat your password" autoComplete="new-password" required /><Button type="submit" size="large" loading={loading} disabled={!token}>Update password</Button></form>}<div className="auth-footer"><Link to="/login">Back to sign in</Link></div></AuthShell>
}