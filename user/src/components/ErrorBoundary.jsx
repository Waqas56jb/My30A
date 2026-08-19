import { Component } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Last line of defence. A render error in one page should never leave the
 * guest staring at a white screen mid-holiday.
 */
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
    console.error('[My30A] Unhandled UI error', error, info)
  }

  componentDidUpdate(prevProps) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="page">
        <div className="nf">
          <h1 style={{ fontSize: 'var(--fs-h1)' }}>Something went wrong</h1>
          <p className="u-small u-muted" style={{ maxWidth: '44ch' }}>
            This screen hit an unexpected error. You can try again or keep browsing — your stay is
            still saved.
          </p>
          <div className="u-row u-wrap" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn" onClick={() => this.setState({ error: null })}>
              Try this page again
            </button>
            <a className="btn btn--secondary" href="/discover">
              Back to home
            </a>
          </div>
          {import.meta.env.DEV && (
            <pre
              style={{
                marginTop: 24,
                textAlign: 'left',
                fontSize: '0.72rem',
                color: 'var(--danger)',
                whiteSpace: 'pre-wrap',
                maxWidth: 720,
              }}
            >
              {String(this.state.error?.stack ?? this.state.error)}
            </pre>
          )}
        </div>
      </div>
    )
  }
}

/** Remounts / clears the boundary whenever the URL changes. */
export default function RouteErrorBoundary({ children }) {
  const location = useLocation()
  return <ErrorBoundary resetKey={location.pathname + location.search}>{children}</ErrorBoundary>
}
