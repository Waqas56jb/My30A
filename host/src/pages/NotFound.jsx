import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('Page not found')
  return (
    <div className="hpage">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 'var(--sp-4)',
          minHeight: '56vh',
          padding: 'var(--sp-6)',
        }}
      >
        <Icon name="compass" size={52} style={{ color: 'var(--sand-300)' }} />
        <h1 style={{ fontSize: 'var(--fs-h1)' }}>We can&apos;t find that page</h1>
        <p className="u-small u-muted" style={{ maxWidth: '42ch' }}>
          The link may be out of date, or the property it pointed at may have been deleted.
        </p>
        <div className="hrow" style={{ justifyContent: 'center' }}>
          <Button to="/host/dashboard" icon="grid">
            Back to dashboard
          </Button>
          <Button to="/host/help" variant="secondary" icon="info">
            Get help
          </Button>
        </div>
      </div>
    </div>
  )
}
