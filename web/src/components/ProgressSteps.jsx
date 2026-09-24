export default function ProgressSteps({ steps = [], active = 0 }) {
  return (
    <div className="progress-steps" aria-label="Progress">
      {steps.map((step, index) => (
        <div className="progress-step" key={step}>
          <div className={`progress-step__circle ${index <= active ? 'progress-step__circle--active' : ''}`}>{index + 1}</div>
          <span className={index === active ? 'progress-step__label progress-step__label--active' : 'progress-step__label'}>{step}</span>
          {index < steps.length - 1 && <div className={`progress-step__line ${index < active ? 'progress-step__line--active' : ''}`} />}
        </div>
      ))}
    </div>
  )
}
