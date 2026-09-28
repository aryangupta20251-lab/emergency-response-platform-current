import StatusBadge from './StatusBadge'

export default function IncidentTimeline({ events = [] }) {
  if (!events.length) return <div className="incident-empty">No timeline updates are available for this incident.</div>
  return <ol className="incident-timeline">{events.map((event, index) => <li className="incident-timeline__item" key={`${event.status}-${event.time}`}><span className={`incident-timeline__marker ${index === events.length - 1 ? 'incident-timeline__marker--current' : ''}`} /><div className="incident-timeline__content"><div className="incident-timeline__heading"><StatusBadge label={event.status} /><time>{event.time}</time></div><p>{event.note}</p></div></li>)}</ol>
}