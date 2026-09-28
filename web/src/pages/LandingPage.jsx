import { ArrowRight, MapPinned, ShieldCheck, Siren } from 'lucide-react'
import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import Card from '../components/Card'
import Button from '../components/Button'
import MapContainer from '../components/MapContainer'

export default function LandingPage() {
  return <div className="landing-page"><header className="landing-header"><BrandMark /><Link to="/login" className="landing-login">Sign in</Link></header><section className="landing-hero"><div><span className="eyebrow"><Siren size={15} /> Emergency Response Platform</span><h1>Faster response.<br /><span>Safer communities.</span></h1><p>Report road accidents, share your location, and keep incident information organized in one connected platform.</p><div className="landing-actions"><Link to="/login"><Button size="large">Open Demo <ArrowRight size={17} /></Button></Link><Link to="/register"><Button variant="secondary" size="large">Create account</Button></Link></div></div><Card className="landing-preview"><div className="preview-head"><div><span>Map preview</span><strong>Development sample area</strong></div><MapPinned color="var(--color-primary)" /></div><MapContainer center={[30.7415, 76.7683]} zoom={13} /><div className="preview-row"><div><small>Emergency status</small><strong className="green-text"><ShieldCheck size={15} /> Ready</strong></div><div><small>Directory samples</small><strong>3 hospitals</strong></div></div></Card></section></div>
}
