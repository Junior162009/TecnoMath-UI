import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import FigmaApp from './FigmaApp'
import './index.css'
import './ui-fixes.css'

type State = { hasError: boolean; message: string }

class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Error inesperado al cargar TecnoMath.' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('TecnoMath UI runtime error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <main style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 24, background: '#070711', color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <section style={{ maxWidth: 620, width: '100%', padding: 28, borderRadius: 18, border: '1px solid rgba(124,58,237,.32)', background: '#111128', boxShadow: '0 20px 70px rgba(0,0,0,.45)' }}>
          <h1 style={{ margin: '0 0 10px', fontFamily: 'Oxanium, system-ui, sans-serif' }}>TecnoMath</h1>
          <p style={{ margin: '0 0 16px', color: '#cbd5e1' }}>La interfaz encontró un error al iniciar. Recarga para volver a intentarlo.</p>
          <code style={{ display: 'block', padding: 12, borderRadius: 10, background: '#0c0c1e', color: '#a78bfa', overflowWrap: 'anywhere' }}>{this.state.message}</code>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, border: 0, borderRadius: 10, padding: '11px 17px', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Recargar TecnoMath</button>
        </section>
      </main>
    )
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <FigmaApp />
    </AppErrorBoundary>
  </React.StrictMode>,
)
