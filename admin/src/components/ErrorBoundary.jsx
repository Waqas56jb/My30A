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
      <div className="apage">
        <div className="inline-empty" style={{ paddingTop: 'var(--sp-8)' }}>
          {/* Deliberately distinct from ErrorState's "Something went wrong" — a
              crashed screen and a failed request are different problems, and
              the tests need to tell them apart. */}
          <h1 style={{ fontSize: 'var(--fs-h1)', margin: 0 }}>This screen crashed</h1>
          <p className="inline-empty__body">
            An unexpected error stopped the page rendering. Reloading usually fixes it — if it keeps
            happening, send the details below to the engineering team.
          </p>
          <div className="tone-row" style={{ justifyContent: 'center', marginTop: 'var(--sp-3)' }}>
            <button type="button" className="btn" onClick={() => window.location.reload()}>
              Reload the panel
            </button>
            <a className="btn btn--secondary" href="/admin/dashboard">
              Back to the dashboard
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
