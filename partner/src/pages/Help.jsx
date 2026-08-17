import { useState } from 'react'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { DefinitionList } from '../components/ui/Display'
import { Panel, Journey, TrackingCard } from '../components/PartnerUI'
import { usePartner } from '../context/PartnerContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const FAQS = [
  {
    q: 'Does My30A take a commission?',
    a: 'No. There is no commission, no listing fee and no card on file. Guests contact you directly and whatever they spend is entirely yours.',
  },
  {
    q: 'Do guests book through My30A?',
    a: 'No, and that is deliberate. A guest finds you, reads your listing, looks at your photos, then taps Call, Website or Directions. From that moment they are your customer and the arrangement is between the two of you.',
  },
  {
    q: 'So what exactly do you measure?',
    a: 'Four things we can honestly observe: how many guests opened your listing, and how many tapped through to your website, your phone number, or directions. We cannot see what happened after that, and we do not pretend to.',
  },
  {
    q: 'How long does approval take?',
    a: 'Usually under two working days. A local person reads every application — we are not running an open directory, and that is why guests trust the recommendations.',
  },
  {
    q: 'What makes a listing perform well?',
    a: 'Photographs of people enjoying the thing you offer, a description that talks about the evening rather than the equipment, and a working phone number. Listings with three or more good photos get noticeably more taps.',
  },
  {
    q: 'Do I have to publish my prices?',
    a: 'No. If you would rather not, leave the starting price blank and your listing shows "Contact for pricing" instead. Plenty of partners prefer to quote per job.',
  },
  {
    q: 'Where does my listing actually appear?',
    a: 'On the Explore pages for your category, in guest search, on the map near guests staying close by, in answers from Vitoria the guest concierge, and in recommendations from hosts whose properties are nearby.',
  },
]

export default function Help() {
  const { partner } = usePartner()
  const [open, setOpen] = useState(0)
  useDocumentTitle('How My30A works')

  return (
    <div className="ppage ppage--narrow">
      <header style={{ marginBottom: 'var(--sp-5)' }}>
        <h1 style={{ fontSize: 'var(--fs-h1)' }}>How My30A works</h1>
        <p className="u-small u-muted" style={{ marginTop: 4, maxWidth: '60ch' }}>
          The short version: we put your business in front of people already on their way to 30A, and
          then we get out of the way.
        </p>
      </header>

      <Panel title="The partner journey" className="psection" style={{ marginTop: 0 }}>
        <Journey status={partner?.status ?? 'approved'} />
      </Panel>

      <div className="psection">
        <TrackingCard />
      </div>

      <Panel title="Common questions" className="psection" flush>
        {FAQS.map((faq, index) => {
          const isOpen = open === index
          return (
            <div key={faq.q} style={{ borderBottom: index < FAQS.length - 1 ? '1px solid var(--line-soft)' : 0 }}>
              <button
                type="button"
                className="setting-row"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : index)}
                style={{ borderBottom: 0 }}
              >
                <span className="setting-row__text">
                  <span className="setting-row__title">{faq.q}</span>
                </span>
                <Icon
                  name={isOpen ? 'chevronUp' : 'chevronDown'}
                  size={18}
                  className="setting-row__chev"
                />
              </button>
              {isOpen && (
                <p
                  className="u-small u-muted"
                  style={{ padding: '0 var(--sp-4) var(--sp-4)', lineHeight: 1.68, maxWidth: '70ch' }}
                >
                  {faq.a}
                </p>
              )}
            </div>
          )
        })}
      </Panel>

      <Panel title="Talk to a person" className="psection">
        <DefinitionList
          rows={[
            { key: 'Email', value: 'partners@my30a.com' },
            { key: 'Phone', value: '(850) 555-0190' },
            { key: 'Hours', value: '8:00 AM – 6:00 PM CT, Monday to Saturday' },
          ]}
        />
        <div className="prow" style={{ marginTop: 'var(--sp-4)' }}>
          <Button size="sm" variant="secondary" icon="mail" href="mailto:partners@my30a.com" target="_self">
            Email us
          </Button>
          <Button size="sm" variant="ghost" icon="phone" href="tel:8505550190" target="_self">
            Call us
          </Button>
        </div>
        <p className="u-xs u-muted" style={{ marginTop: 'var(--sp-3)' }}>
          Prototype build — these contact details are illustrative.
        </p>
      </Panel>

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
