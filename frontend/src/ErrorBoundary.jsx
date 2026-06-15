import React from 'react'
import './App.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    this.setState({ error, info })
    console.error('ErrorBoundary caught', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-shell error-fallback">
          <div className="panel">
            <h2>Ocorreu um erro na aplicação</h2>
            <p>{this.state.error?.message}</p>
            <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left', maxHeight: 300, overflow: 'auto' }}>
              {this.state.info?.componentStack}
            </pre>
            <button className="button primary" onClick={() => window.location.reload()}>Recarregar</button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
