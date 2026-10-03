import { KeyRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import Alert from '../components/Alert'
import AuthShell from '../components/AuthShell'
import Button from '../components/Button'
import Input from '../components/Input'
import { useAuth } from '../context/AuthContext'

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true)
    try { await requestPasswordReset(identifier); setSent(true) } catch (submitError) { setError(submitError.message) } finally { setLoading(false) }
  }

  return <AuthShell backTo="/login" backLabel="Back to sign in"><div className="auth-icon"><KeyRound size={24} /></div><h1>Reset your password</h1><p>Enter the email or phone number associated with your account.</p>{error && <Alert tone="error" title="Unable to request reset">{error}</Alert>}{sent ? <><Alert tone="success" title="Check your reset delivery channel">If an active account matches that information, reset instructions have been sent. In local development, check the backend terminal for the reset link.</Alert></> : <form onSubmit={submit}><Input label="Email or phone" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="you@example.com" autoComplete="username" required /><Button type="submit" size="large" loading={loading}>Send reset instructions</Button></form>}<div className="auth-footer"><Link to="/login">Back to sign in</Link></div></AuthShell>
}