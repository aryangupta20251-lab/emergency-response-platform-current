import { LockKeyhole } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Alert from '../components/Alert'
import AuthShell from '../components/AuthShell'
import Button from '../components/Button'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../context/AuthContext'

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true)
    try { await resetPassword(form); setSuccess(true); setTimeout(() => navigate('/login'), 700) } catch (submitError) { setError(submitError.message) } finally { setLoading(false) }
  }

  return <AuthShell backTo="/forgot-password" backLabel="Back to password help"><div className="auth-icon"><LockKeyhole size={24} /></div><h1>Choose a new password</h1><p>This is a frontend-only reset screen. No real account or token is changed.</p>{error && <Alert tone="error" title="Check your password">{error}</Alert>}{success && <Alert tone="success" title="Password updated">Mock reset complete. Redirecting to sign in.</Alert>}<form onSubmit={submit}><PasswordInput label="New password" name="password" value={form.password} onChange={update} placeholder="At least 6 characters" autoComplete="new-password" required /><PasswordInput label="Confirm password" name="confirmPassword" value={form.confirmPassword} onChange={update} placeholder="Repeat your password" autoComplete="new-password" required /><Button type="submit" size="large" loading={loading}>Update password</Button></form><div className="auth-footer"><Link to="/login">Back to sign in</Link></div></AuthShell>
}