import { Component } from 'react'
import { RotateCcw, ShieldAlert } from 'lucide-react'
import Button from './Button'
import Card from './Card'

export default class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() { return { hasError: true } }

  render() {
    if (!this.state.hasError) return this.props.children
    return <main className="error-page"><Card className="error-page__card"><div className="error-page__icon"><ShieldAlert size={28} /></div><h1>Something went wrong</h1><p>We could not display this screen. Please retry or return to the dashboard.</p><div className="report-actions"><Button variant="ghost" onClick={() => window.location.assign('/dashboard')}>Dashboard</Button><Button onClick={() => window.location.reload()}><RotateCcw size={16} /> Retry</Button></div></Card></main>
  }
}