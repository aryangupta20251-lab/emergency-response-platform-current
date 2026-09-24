import { Construction } from 'lucide-react'
import Card from './Card'

export default function PlaceholderPage({ title, description }) {
  return (
    <Card className="placeholder-page">
      <div className="placeholder-page__icon"><Construction size={28} /></div>
      <h2>{title}</h2>
      <p>{description || 'This screen is reserved for a later development phase.'}</p>
    </Card>
  )
}
