import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Section, Callout, DefinitionList } from '../components/ui/Display'
import { Field, Input, Textarea } from '../components/ui/Form'
import { SuccessState } from '../components/ui/States'
import SiteFooter from '../components/SiteFooter'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const FAQS = [
  {
    q: 'How do I get an access code?',
    a: 'Your host sends one with your booking confirmation, and there is usually a QR sticker inside the front door. It looks like MY30A-8842. Without it you can still browse everything about 30A — you just will not see your property details.',
  },
  {
    q: 'Is Vitoria a real person?',
    a: 'No. Vitoria is our AI concierge, trained on this stretch of coast and on the specific property you are staying in. If something needs a human, she will hand you to your host or our team.',
  },
  {
    q: 'Do you book the local partners for me?',
    a: 'No, and that is deliberate. We introduce you to the businesses we trust, then you book directly with them by phone or on their own site. They keep the whole booking and you get the local relationship.',
  },
  {
    q: 'What do you actually handle yourselves?',
    a: 'Grocery delivery and airport transfers. Those go through our concierge team end to end, including payment.',
  },
  {
    q: 'When am I charged?',
    a: 'Never at the request stage. For groceries we confirm the list first and take payment before shopping. For transfers we authorise your card once a vehicle is confirmed — a hold, not a charge — and capture it after the ride.',
  },
  {
    q: 'Can I use this before my trip?',
    a: 'Yes, and most guests do. Sorting groceries and your airport pickup a few days ahead is the difference between arriving and starting your holiday.',
  },
]

export default function Help() {
  const { property, pushToast, hasGuest } = useApp()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)
  useDocumentTitle('Help & contact')

  const submit = (event) => {
    event.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Let us know who you are.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'We need a valid email to reply to.'
    if (form.message.trim().length < 10) next.message = 'A little more detail helps us help you.'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      setSent(true)
      pushToast({ tone: 'success', title: 'Message sent', message: 'We usually reply within an hour.' })
    }, 600)
  }

  return (
    <div className="page">
      <PageHeader
        title="Help & contact"
        subtitle="How this works, and how to reach a human when you need one."
      />

      <Section title="Common questions">
        <div className="card" style={{ overflow: 'hidden' }}>
          {FAQS.map((faq, i) => (
            <div key={faq.q} style={{ borderBottom: i < FAQS.length - 1 ? '1px solid var(--line-soft)' : 0 }}>
              <button
                type="button"
                className="setting-row"
                aria-expanded={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                style={{ borderBottom: 0 }}
              >
                <span className="setting-row__text">
                  <span className="setting-row__title">{faq.q}</span>
                </span>
                <Icon
                  name={openFaq === i ? 'chevronUp' : 'chevronDown'}
                  size={18}
                  className="setting-row__chev"
                />
              </button>
              {openFaq === i && (
                <p
                  className="u-small u-muted"
                  style={{ padding: '0 var(--sp-4) var(--sp-4)', lineHeight: 1.65, maxWidth: '68ch' }}
                >
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Reach us">
        <div className="grid grid--2">
          <div className="card card--pad">
            <h3 style={{ fontSize: '1.05rem', marginBottom: 12 }}>My30A concierge</h3>
            <DefinitionList
              rows={[
                { key: 'Email', value: 'concierge@my30a.com' },
                { key: 'Phone', value: '(850) 555-0100' },
                { key: 'Hours', value: '7:00 AM – 9:00 PM CT, daily' },
                { key: 'Typical reply', value: 'Within an hour' },
              ]}
            />
            <div className="u-row u-wrap" style={{ marginTop: 'var(--sp-4)' }}>
              <Button size="sm" icon="sparkles" to="/vitoria">
                Ask Vitoria first
              </Button>
              <Button
                size="sm"
                variant="secondary"
                icon="phone"
                href="tel:8505550100"
                target="_self"
              >
                Call us
              </Button>
            </div>
          </div>

          <div className="card card--pad">
            <h3 style={{ fontSize: '1.05rem', marginBottom: 12 }}>
              {hasGuest ? 'Your host' : 'Property hosts'}
            </h3>
            {hasGuest && property ? (
              <>
                <DefinitionList
                  rows={[
                    { key: 'Host', value: property.host.name },
                    { key: 'Company', value: property.host.company },
                    { key: 'Phone', value: property.host.phone },
                    { key: 'Email', value: property.host.email },
                  ]}
                />
                <Button size="sm" to="/my-stay" icon="key" style={{ marginTop: 'var(--sp-4)' }}>
                  Property details
                </Button>
              </>
            ) : (
              <>
                <p className="u-small u-muted" style={{ lineHeight: 1.65 }}>
                  Unlock your stay with the code from your booking and your host&apos;s details appear
                  here, along with your WiFi, door code, and check-out steps.
                </p>
                <Button size="sm" to="/access" icon="key" style={{ marginTop: 'var(--sp-4)' }}>
                  Enter your code
                </Button>
              </>
            )}
          </div>
        </div>
      </Section>

      <Section title="Send us a message">
        {sent ? (
          <SuccessState
            title="Message sent"
            message="Thanks — we have it, and we usually reply within the hour. Anything urgent is faster by phone."
          >
            <Button variant="secondary" size="sm" onClick={() => setSent(false)}>
              Send another
            </Button>
          </SuccessState>
        ) : (
          <form className="form-card" onSubmit={submit} noValidate>
            <div className="field-row field-row--2">
              <Field label="Your name" required error={errors.name}>
                {(props) => (
                  <Input
                    {...props}
                    value={form.name}
                    autoComplete="name"
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                )}
              </Field>
              <Field label="Email" required error={errors.email}>
                {(props) => (
                  <Input
                    {...props}
                    type="email"
                    value={form.email}
                    autoComplete="email"
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                )}
              </Field>
            </div>
            <Field label="How can we help?" required error={errors.message}>
              {(props) => (
                <Textarea
                  {...props}
                  rows={5}
                  value={form.message}
                  placeholder="Tell us what you need and we will sort it."
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
              )}
            </Field>
            <Button type="submit" loading={busy} icon="send" style={{ alignSelf: 'flex-start' }}>
              Send message
            </Button>
          </form>
        )}
      </Section>

      <Callout icon="info" className="section">
        This is a prototype — the contact form does not send anything yet, and no data leaves your
        browser. See{' '}
        <Link to="/settings" style={{ textDecoration: 'underline' }}>
          Settings
        </Link>{' '}
        for the mock analytics log.
      </Callout>

      <SiteFooter />
    </div>
  )
}
