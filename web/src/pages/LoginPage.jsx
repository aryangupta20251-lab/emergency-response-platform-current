import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import BrandMark from '../components/BrandMark'

export default function LoginPage() {
  const navigate = useNavigate()
  return <div className="auth-page"><div className="auth-brand"><BrandMark /></div><Card className="auth-card"><div className="auth-icon"><ShieldCheck size={24} /></div><h1>Welcome back</h1><p>Sign in to your Emergency Response account.</p><form onSubmit={(e) => { e.preventDefault(); navigate('/dashboard') }}><Input label="Email" type="email" placeholder="you@example.com" required /><Input label="Password" type="password" placeholder="••••••••" required /><div className="auth-row"><label><input type="checkbox" /> Remember me</label><Link to="/forgot-password">Forgot password?</Link></div><Button type="submit" size="large">Sign in</Button></form><div className="auth-demo">Demo mode · any valid-looking email and password will continue</div><div className="auth-footer">New here? <Link to="/register">Create an account</Link></div></Card></div>
}
