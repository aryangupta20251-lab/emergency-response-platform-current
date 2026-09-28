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

  return <AuthShell backTo="/login" backLabel="Back to sign in"><div className="auth-icon"><KeyRound size={24} /></div><h1>Reset your password</h1><p>Enter your email or phone and we will prepare the next step in this mock flow.</p>{error && <Alert tone="error" title="Unable to continue">{error}</Alert>}{sent ? <><Alert tone="success" title="Reset request ready">This frontend demo does not send email or create a real reset token.</Alert><Link className="btn btn--primary btn--large auth-action-link" to="/reset-password">Continue to reset password</Link></> : <form onSubmit={submit}><Input label="Email or phone" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="you@example.com" required /><Button type="submit" size="large" loading={loading}>Prepare reset</Button></form>}<div className="auth-footer"><Link to="/login">Back to sign in</Link></div></AuthShell>
}