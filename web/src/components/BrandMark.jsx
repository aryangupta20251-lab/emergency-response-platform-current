import { MapPinPlus } from 'lucide-react'

export default function BrandMark({ compact = false }) {
  return (
    <div className={`brand-mark ${compact ? 'brand-mark--compact' : ''}`}>
      <span className="brand-mark__icon"><MapPinPlus size={compact ? 20 : 28} strokeWidth={2.2} /></span>
      {!compact && <span><strong>Emergency Response</strong><small>Faster response. Safer communities.</small></span>}
    </div>
  )
}
