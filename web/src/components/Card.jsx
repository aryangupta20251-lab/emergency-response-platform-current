export default function Card({ children, className = '', padded = true }) {
  return <section className={`card ${padded ? 'card--padded' : ''} ${className}`}>{children}</section>
}
