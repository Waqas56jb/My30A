import { Component, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[My30A Admin] Unhandled UI error', error, info)
  }

  componentDidUpdate(prevProps) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    const message = this.state.error?.message || String(this.state.error)

    return (
      <div className="apage">
        <div className="nf">
          <h1 style={{ fontSize: 'var(--fs-h1)' }}>Something went wrong</h1>
          <p className="u-small u-muted" style={{ maxWidth: '44ch' }}>
            This screen hit an unexpected error. Try again or go back to operations.
          </p>
          {message && (
            <p className="u-xs u-muted" style={{ maxWidth: '52ch', fontFamily: 'monospace' }}>
              {message}
            </p>
          )}
          <div className="u-row u-wrap" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn" onClick={() => this.setState({ error: null })}>
              Try this page again
            </button>
            <a className="btn btn--secondary" href="/admin">
              Back to overview
            </a>
          </div>
        </div>
      </div>
    )
  }
}

export default function RouteErrorBoundary({ children }) {
  const location = useLocation()
  const [gen, setGen] = useState(0)

  useEffect(() => {
    const hot = import.meta.hot
    if (!hot) return undefined
    const bump = () => setGen((n) => n + 1)
    hot.on('vite:afterUpdate', bump)
    return () => hot.off('vite:afterUpdate', bump)
  }, [])

  return (
    <ErrorBoundary resetKey={`${location.pathname}${location.search}:${gen}`}>
      {children}
    </ErrorBoundary>
  )
}
