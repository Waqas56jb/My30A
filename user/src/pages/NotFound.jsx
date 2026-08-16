import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('Page not found')
  return (
    <div className="page">
      <div className="nf">
        <span className="nf__code" aria-hidden="true">
          <Icon name="compass" style={{ width: 56, height: 56 }} />
        </span>
        <h1 style={{ fontSize: 'var(--fs-h1)' }}>We can’t find that page</h1>
        <p className="u-small u-muted" style={{ maxWidth: '42ch' }}>
          The link may have expired, or you may have followed an old one. Vitoria can point you back
          in the right direction.
        </p>
        <div className="u-row u-wrap" style={{ justifyContent: 'center' }}>
          <Button to="/" icon="home">
            Back to home
          </Button>
          <Button to="/vitoria" variant="secondary" icon="sparkles">
            Ask Vitoria
          </Button>
        </div>
      </div>
    </div>
  )
}
