import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import BrandMark from './BrandMark'
import Card from './Card'

export default function AuthShell({ children, backTo = '/', backLabel = 'Back to home' }) {
  return <div className="auth-page"><div className="auth-brand"><BrandMark /></div><Link className="auth-back" to={backTo}><ArrowLeft size={16} /> {backLabel}</Link><Card className="auth-card">{children}</Card></div>
}