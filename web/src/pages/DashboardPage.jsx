import { ArrowRight, Bell, Hospital, MapPin, Phone, Plus, ShieldAlert, Siren, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import MapContainer from '../components/MapContainer'
import { useAuth } from '../context/AuthContext'
import { dashboardData } from '../data/dashboardData'

const quickActions = [
  { to: '/report-accident', title: 'Report accident', detail: 'Submit a platform incident report', icon: ShieldAlert, tone: 'emergency' },
  { to: '/hospitals', title: 'Find hospitals', detail: 'View nearby emergency care', icon: Hospital, tone: 'primary' },
  { to: '/emergency-contacts', title: 'Emergency contacts', detail: 'Keep trusted people ready', icon: Phone, tone: 'secondary' }
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'there'
  const { location, hospitals, contacts, incident, updates } = dashboardData

  return <div className="page-content dashboard-page">
    <div className="page-header dashboard-header">
      <div><span className="eyebrow"><Siren size={14} /> Citizen dashboard</span><h1 className="page-title">{getGreeting()}, {firstName}</h1><p className="page-subtitle">Stay prepared. Your safety comes first.</p></div>
      <Link to="/report-accident"><Button size="large"><ShieldAlert size={18} /> Report Accident</Button></Link>
    </div>

    <div className="dashboard-demo-note"><span className="status-dot status-dot--info" /><span>Demo dashboard</span><small>Location, hospital, incident, and contact details are sample information.</small></div>

    <div className="dashboard-grid">
      <Card className="emergency-card">
        <div><span className="eyebrow">Emergency action</span><h2>Need help after a road accident?</h2><p>Share your location and incident details through the guided report.</p></div>
        <Link to="/report-accident"><Button>Report Accident <ArrowRight size={16} /></Button></Link>
      </Card>

      <Card className="dashboard-card dashboard-card--location">
        <div className="card-heading"><div><span className="muted-label">{location.label}</span><h3>{location.name}</h3><small className="card-note">{location.note}</small></div><MapPin color="var(--color-primary)" size={20} /></div>
        <div className="dashboard-map"><MapContainer /></div>
      </Card>

      <Card className="dashboard-card dashboard-card--hospitals">
        <div className="card-heading"><div><span className="muted-label">Nearby hospitals</span><h3>3 hospitals found</h3></div><Hospital color="var(--color-primary)" size={20} /></div>
        <div className="mini-list">{hospitals.map((hospital) => <div className="mini-list__item" key={hospital.name}><span className="mini-icon"><Hospital size={16} /></span><span><strong>{hospital.name}</strong><small>{hospital.distance} · {hospital.detail}</small></span><ArrowRight size={15} /></div>)}</div>
        <Link className="text-link" to="/hospitals">View all hospitals <ArrowRight size={14} /></Link>
      </Card>

      <Card className="dashboard-card dashboard-card--actions">
        <div className="card-heading"><div><span className="muted-label">Quick actions</span><h3>What do you need?</h3></div><Plus color="var(--color-secondary)" size={20} /></div>
        <div className="quick-actions">{quickActions.map(({ to, title, detail, icon: Icon, tone }) => <Link className="quick-action" to={to} key={to}><span className={`quick-action__icon quick-action__icon--${tone}`}><Icon size={18} /></span><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={15} /></Link>)}</div>
      </Card>

      <Card className="dashboard-card dashboard-card--incident">
        <div className="card-heading"><div><span className="muted-label">Recent incident</span><h3>Demo incident</h3></div><StatusBadge label={incident.status} /></div>
        <div className="incident-summary"><div><small>Incident ID</small><strong>{incident.id}</strong></div><div><small>Location</small><strong>{incident.location}</strong></div><div><small>Updated</small><strong>{incident.time}</strong></div></div>
        <Link className="text-link" to="/incidents">View incident <ArrowRight size={14} /></Link>
      </Card>

      <Card className="dashboard-card dashboard-card--contacts">
        <div className="card-heading"><div><span className="muted-label">Emergency contacts</span><h3>Trusted people</h3></div><UserRound color="var(--color-secondary)" size={20} /></div>
        <div className="mini-list">{contacts.map((contact) => <div className="mini-list__item" key={contact.name}><span className="mini-icon mini-icon--secondary"><UserRound size={16} /></span><span><strong>{contact.name}</strong><small>{contact.relation} · {contact.phone}</small></span></div>)}</div>
        <Link className="text-link" to="/emergency-contacts">Manage contacts <ArrowRight size={14} /></Link>
      </Card>

      <Card className="dashboard-card dashboard-card--updates">
        <div className="card-heading"><div><span className="muted-label">Recent updates</span><h3>Stay informed</h3></div><Bell color="var(--color-primary)" size={20} /></div>
        <div className="mini-list">{updates.map((update, index) => <div className="mini-list__item" key={update.title}><span className="notification-icon">{index ? <Plus size={15} /> : <Bell size={15} />}</span><span><strong>{update.title}</strong><small>{update.detail}</small></span></div>)}</div>
        <Link className="text-link" to="/notifications">View notifications <ArrowRight size={14} /></Link>
      </Card>
    </div>
  </div>
}