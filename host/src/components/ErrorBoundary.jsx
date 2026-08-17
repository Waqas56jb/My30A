import { Component } from 'react'

/**
 * Last line of defence. A render error in one page should never leave the
 * guest staring at a white screen mid-holiday.
 */
export default class ErrorBoundary extends Component {
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

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="page">
        <div className="nf">
          <h1 style={{ fontSize: 'var(--fs-h1)' }}>Something went wrong</h1>
          <p className="u-small u-muted" style={{ maxWidth: '44ch' }}>
            We hit an unexpected error. Reloading usually fixes it — if it keeps happening, your host
            can reach our team directly.
          </p>
          <div className="u-row u-wrap" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn" onClick={() => window.location.reload()}>
              Reload the app
            </button>
            <a className="btn btn--secondary" href="/">
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
