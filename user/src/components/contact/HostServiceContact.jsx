import Button from '../ui/Button'
import { DefinitionList } from '../ui/Display'
import { HOST_CONTACT } from '../../config/contact'

/**
 * Text line for guests who have already booked grocery delivery or an
 * airport transfer. Do not render this on public pages.
 */
export default function HostServiceContact({ service = 'request' }) {
  const label = service === 'transfer' ? 'airport transfer' : 'grocery request'

  return (
    <div className="card card--pad">
      <h2 style={{ fontSize: '1.05rem', marginBottom: 8 }}>Text My30A Host</h2>
      <p className="u-small u-muted" style={{ lineHeight: 1.65, marginBottom: 12 }}>
        This number is for your {label}. Email is always fine too.
      </p>
      <DefinitionList
        rows={[
          { key: 'Text', value: HOST_CONTACT.phoneDisplay },
          { key: 'Email', value: HOST_CONTACT.email },
        ]}
      />
      <div className="u-row u-wrap" style={{ marginTop: 12 }}>
        <Button size="sm" icon="phone" href={HOST_CONTACT.phoneSms} target="_self">
          Text us
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon="mail"
          href={`mailto:${HOST_CONTACT.email}`}
          target="_self"
        >
          Email
        </Button>
      </div>
    </div>
  )
}
