import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('Page not found')
  return (
    <div className="apage">
      <div className="inline-empty" style={{ paddingTop: 'var(--sp-9)' }}>
        <span className="inline-empty__icon" aria-hidden="true" style={{ width: 60, height: 60 }}>
          <Icon name="compass" style={{ width: 28, height: 28 }} />
        </span>
        <h1 style={{ fontSize: 'var(--fs-h1)', margin: 0 }}>We cannot find that page</h1>
        <p className="inline-empty__body">
          The link may have changed, or you may have followed an old one. Everything in the panel is
          reachable from the navigation.
        </p>
        <div className="tone-row" style={{ justifyContent: 'center', marginTop: 'var(--sp-3)' }}>
          <Button to="/admin/dashboard" icon="grid">Dashboard</Button>
          <Button to="/admin/operations" variant="secondary" icon="compass">Operations</Button>
        </div>
      </div>
    </div>
  )
}
