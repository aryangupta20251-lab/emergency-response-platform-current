import { Link, useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import BrandMark from '../components/BrandMark'

export default function RegisterPage() {
  const navigate = useNavigate()
  return <div className="auth-page"><div className="auth-brand"><BrandMark /></div><Card className="auth-card"><h1>Create account</h1><p>Set up your citizen demo account.</p><form onSubmit={(e) => { e.preventDefault(); navigate('/dashboard') }}><Input label="Full name" placeholder="Aryan Gupta" required /><Input label="Phone" placeholder="+91 98765 43210" required /><Input label="Email" type="email" placeholder="you@example.com" required /><Input label="Password" type="password" placeholder="Create a password" required /><Button type="submit" size="large">Create account</Button></form><div className="auth-footer">Already registered? <Link to="/login">Sign in</Link></div></Card></div>
}
