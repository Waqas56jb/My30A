import { useEffect, useState } from 'react'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/Modal'
import { SkeletonPage } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { Callout } from '../../components/ui/Display'
import { Field, Input, Textarea, Select, Switch } from '../../components/ui/Form'
import { PageHeader, Panel, Grid, MockPaymentNote } from '../../components/common/AdminUI'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { SETTINGS_SECTIONS } from '../../data/settings'
import { cx, formatCurrency } from '../../utils/format'

/** One row: a labelled control with an explanation of what it changes. */
function Row({ title, sub, children }) {
  return (
    <div className="setting-row">
      <span className="setting-row__text">
        <span className="setting-row__title">{title}</span>
        {sub && <span className="setting-row__sub">{sub}</span>}
      </span>
      <span className="setting-row__control">{children}</span>
    </div>
  )
}

/**
 * Platform settings.
 *
 * Commercial rules — plans, service fees, cancellation tiers, tip presets —
 * live here rather than being hardcoded in the screens that display them,
 * because the final numbers are not agreed yet and will change more than once.
 */
export default function Settings() {
  useDocumentTitle('Settings')
  const { pushToast } = useAdmin()
  const { data, loading, error, reload } = useLoad(() => api.getSettings(), [])

  const [section, setSection] = useState('general')
  const [draft, setDraft] = useState(null)
  const [busy, setBusy] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  useEffect(() => {
    if (data) setDraft(data)
  }, [data])

  if (loading || !draft) return <SkeletonPage />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const set = (key, value) =>
    setDraft((d) => ({ ...d, [section]: { ...d[section], [key]: value } }))

  const save = async () => {
    setBusy(true)
    try {
      await api.updateSettings(section, draft[section])
      pushToast({ tone: 'success', title: 'Settings saved' })
      reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not save', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const resetEverything = async () => {
    api.resetAll()
    pushToast({ tone: 'success', title: 'Demo data reset', message: 'Every table is back to its shipped state.' })
    setResetOpen(false)
    reload()
  }

  const s = draft[section]
  const meta = SETTINGS_SECTIONS.find((x) => x.id === section)

  return (
    <div className="apage">
      <PageHeader
        title="Settings"
        subtitle="Platform configuration. Commercial rules live here rather than in the code, because they are not final."
        actions={
          <>
            <Button variant="secondary" icon="refresh" onClick={() => setResetOpen(true)}>
              Reset demo data
            </Button>
            <Button onClick={save} loading={busy} icon="check">Save changes</Button>
          </>
        }
      />

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {SETTINGS_SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cx('settings-nav__btn', section === item.id && 'is-active')}
              aria-pressed={section === item.id}
              onClick={() => setSection(item.id)}
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="u-stack" style={{ gap: 'var(--sp-5)' }}>
          <Panel title={meta.label} subtitle={meta.blurb}>
            {/* ------------------------------ General ---------------------- */}
            {section === 'general' && (
              <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
                <Grid cols={2}>
                  <Field label="Platform name">
                    {(p) => <Input {...p} value={s.platformName} onChange={(e) => set('platformName', e.target.value)} />}
                  </Field>
                  <Field label="Support email">
                    {(p) => <Input {...p} type="email" value={s.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} />}
                  </Field>
                  <Field label="Support phone">
                    {(p) => <Input {...p} value={s.supportPhone} onChange={(e) => set('supportPhone', e.target.value)} />}
                  </Field>
                  <Field label="Timezone">
                    {(p) => <Input {...p} value={s.timezone} onChange={(e) => set('timezone', e.target.value)} />}
                  </Field>
                  <Field label="Currency">
                    {(p) => <Input {...p} value={s.currency} onChange={(e) => set('currency', e.target.value)} />}
                  </Field>
                </Grid>
                <Field label="Service area">
                  {(p) => <Textarea {...p} rows={2} value={s.serviceArea} onChange={(e) => set('serviceArea', e.target.value)} />}
                </Field>
              </div>
            )}

            {/* ------------------------------ Business --------------------- */}
            {section === 'business' && (
              <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
                <p className="stat__label">Host plans</p>
                {s.plans.map((plan, i) => (
                  <Grid cols={3} key={plan.id}>
                    <Field label="Plan name">
                      {(p) => (
                        <Input
                          {...p}
                          value={plan.name}
                          onChange={(e) => {
                            const plans = [...s.plans]
                            plans[i] = { ...plan, name: e.target.value }
                            set('plans', plans)
                          }}
                        />
                      )}
                    </Field>
                    <Field label="Price per month">
                      {(p) => (
                        <Input
                          {...p}
                          type="number"
                          value={plan.price}
                          onChange={(e) => {
                            const plans = [...s.plans]
                            plans[i] = { ...plan, price: Number(e.target.value) }
                            set('plans', plans)
                          }}
                        />
                      )}
                    </Field>
                    <Field label="Properties included">
                      {(p) => (
                        <Input
                          {...p}
                          type="number"
                          value={plan.properties}
                          onChange={(e) => {
                            const plans = [...s.plans]
                            plans[i] = { ...plan, properties: Number(e.target.value) }
                            set('plans', plans)
                          }}
                        />
                      )}
                    </Field>
                  </Grid>
                ))}

                <Field label="Trial length (days)">
                  {(p) => <Input {...p} type="number" value={s.trialDays} onChange={(e) => set('trialDays', Number(e.target.value))} />}
                </Field>

                <Row title="Hosts need approval" sub="New host accounts wait in a queue before their properties can go live.">
                  <Switch checked={s.requireHostApproval} onChange={(v) => set('requireHostApproval', v)} label="Hosts need approval" />
                </Row>
                <Row title="Partners need approval" sub="Applications are reviewed before the listing is visible to guests.">
                  <Switch checked={s.requirePartnerApproval} onChange={(v) => set('requirePartnerApproval', v)} label="Partners need approval" />
                </Row>
                <Row title="Publish on approval" sub="Approving a partner makes the listing live immediately, rather than leaving it hidden.">
                  <Switch checked={s.autoPublishApprovedPartners} onChange={(v) => set('autoPublishApprovedPartners', v)} label="Publish on approval" />
                </Row>
              </div>
            )}

            {/* ------------------------------ Payments --------------------- */}
            {section === 'payments' && (
              <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
                <MockPaymentNote />

                <p className="stat__label">Grocery service fee tiers</p>
                {s.serviceFees.map((tier, i) => (
                  <Grid cols={3} key={tier.id}>
                    <Field label="Tier">
                      {(p) => (
                        <Input
                          {...p}
                          value={tier.label}
                          onChange={(e) => {
                            const tiers = [...s.serviceFees]
                            tiers[i] = { ...tier, label: e.target.value }
                            set('serviceFees', tiers)
                          }}
                        />
                      )}
                    </Field>
                    <Field label="Basket up to" hint={tier.upTo === null ? 'No limit' : undefined}>
                      {(p) => (
                        <Input
                          {...p}
                          type="number"
                          value={tier.upTo ?? ''}
                          placeholder="No limit"
                          onChange={(e) => {
                            const tiers = [...s.serviceFees]
                            tiers[i] = { ...tier, upTo: e.target.value === '' ? null : Number(e.target.value) }
                            set('serviceFees', tiers)
                          }}
                        />
                      )}
                    </Field>
                    <Field label="Service fee">
                      {(p) => (
                        <Input
                          {...p}
                          type="number"
                          value={tier.fee}
                          onChange={(e) => {
                            const tiers = [...s.serviceFees]
                            tiers[i] = { ...tier, fee: Number(e.target.value) }
                            set('serviceFees', tiers)
                          }}
                        />
                      )}
                    </Field>
                  </Grid>
                ))}

                <p className="stat__label" style={{ marginTop: 'var(--sp-3)' }}>
                  Transfer cancellation rules
                </p>
                {s.cancellationRules.map((rule, i) => (
                  <Grid cols={3} key={rule.id}>
                    <Field label="Window">
                      {(p) => <Input {...p} value={rule.label} readOnly />}
                    </Field>
                    <Field label="Hours before pickup">
                      {(p) => (
                        <Input
                          {...p}
                          type="number"
                          value={rule.hours}
                          onChange={(e) => {
                            const rules = [...s.cancellationRules]
                            rules[i] = { ...rule, hours: Number(e.target.value) }
                            set('cancellationRules', rules)
                          }}
                        />
                      )}
                    </Field>
                    <Field label="Fee retained">
                      {(p) => (
                        <Input
                          {...p}
                          type="number"
                          value={rule.fee}
                          onChange={(e) => {
                            const rules = [...s.cancellationRules]
                            rules[i] = { ...rule, fee: Number(e.target.value) }
                            set('cancellationRules', rules)
                          }}
                        />
                      )}
                    </Field>
                  </Grid>
                ))}

                <Field label="Tip presets" hint="Comma separated percentages offered to guests.">
                  {(p) => (
                    <Input
                      {...p}
                      value={s.tipPresets.join(', ')}
                      onChange={(e) =>
                        set(
                          'tipPresets',
                          e.target.value.split(',').map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n)),
                        )
                      }
                    />
                  )}
                </Field>

                <Row
                  title="Capture transfers on completion"
                  sub="The card hold becomes a charge only when the ride is marked completed. Turning this off would charge at confirmation."
                >
                  <Switch
                    checked={s.captureTransfersOnCompletion}
                    onChange={(v) => set('captureTransfersOnCompletion', v)}
                    label="Capture transfers on completion"
                  />
                </Row>

                <Callout icon="lock">{s.processorLabel}</Callout>
              </div>
            )}

            {/* ---------------------------- Notifications ------------------ */}
            {section === 'notifications' && (
              <div>
                <Row title="Push notifications" sub="Master switch for push to guests, hosts and partners.">
                  <Switch checked={s.pushEnabled} onChange={(v) => set('pushEnabled', v)} label="Push notifications" />
                </Row>
                <Row title="Email notifications" sub="Master switch for transactional email.">
                  <Switch checked={s.emailEnabled} onChange={(v) => set('emailEnabled', v)} label="Email notifications" />
                </Row>
                <Row title="Daily operations digest" sub="A morning summary of everything waiting in the queues.">
                  <Switch checked={s.dailyOpsDigest} onChange={(v) => set('dailyOpsDigest', v)} label="Daily operations digest" />
                </Row>
                <Row title="Alert on failed payment" sub="Tell the finance role as soon as a card is declined.">
                  <Switch checked={s.alertOnFailedPayment} onChange={(v) => set('alertOnFailedPayment', v)} label="Alert on failed payment" />
                </Row>
                <Row title="Alert on escalation" sub="Tell support the moment Vitoria hands a conversation over.">
                  <Switch checked={s.alertOnEscalation} onChange={(v) => set('alertOnEscalation', v)} label="Alert on escalation" />
                </Row>
                <Field label="Digest time">
                  {(p) => <Input {...p} value={s.digestTime} onChange={(e) => set('digestTime', e.target.value)} />}
                </Field>
              </div>
            )}

            {/* -------------------------------- AI ------------------------- */}
            {section === 'ai' && (
              <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
                <Grid cols={2}>
                  <Field label="Assistant name">
                    {(p) => <Input {...p} value={s.assistantName} onChange={(e) => set('assistantName', e.target.value)} />}
                  </Field>
                  <Field label="Tone">
                    {(p) => <Input {...p} value={s.tone} onChange={(e) => set('tone', e.target.value)} />}
                  </Field>
                </Grid>

                <Field label="Escalate after unresolved replies" hint="How many turns before a human is brought in.">
                  {(p) => (
                    <Input
                      {...p}
                      type="number"
                      min="1"
                      value={s.escalateAfterUnresolved}
                      onChange={(e) => set('escalateAfterUnresolved', Number(e.target.value))}
                    />
                  )}
                </Field>

                <Row
                  title="Vitoria can create service requests"
                  sub="She collects the details and raises a grocery or transfer request. A human still confirms it."
                >
                  <Switch checked={s.canCreateRequests} onChange={(v) => set('canCreateRequests', v)} label="Can create service requests" />
                </Row>

                <Row
                  title="Vitoria can quote partner prices"
                  sub="Off by default, and it should stay off. My30A does not control partner pricing or availability, so quoting one is a promise we cannot keep."
                >
                  <Switch checked={s.canQuotePartnerPrices} onChange={(v) => set('canQuotePartnerPrices', v)} label="Can quote partner prices" />
                </Row>

                <Field label="Languages" hint="Comma separated.">
                  {(p) => (
                    <Input
                      {...p}
                      value={s.languages.join(', ')}
                      onChange={(e) => set('languages', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))}
                    />
                  )}
                </Field>

                <Callout icon="sparkles">{s.modelLabel}</Callout>
              </div>
            )}

            {/* ----------------------------- Local Guide ------------------- */}
            {section === 'localGuide' && (
              <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
                <Field label="Default sort">
                  {(p) => (
                    <Select {...p} value={s.defaultSort} onChange={(e) => set('defaultSort', e.target.value)}>
                      <option>Featured first</option>
                      <option>Most viewed</option>
                      <option>Alphabetical</option>
                      <option>Nearest first</option>
                    </Select>
                  )}
                </Field>

                <Row
                  title="Show prices when known"
                  sub="Listings without a price fall back to the label below rather than showing nothing."
                >
                  <Switch checked={s.showPricesWhenKnown} onChange={(v) => set('showPricesWhenKnown', v)} label="Show prices when known" />
                </Row>

                <Field label="Fallback price label">
                  {(p) => <Input {...p} value={s.fallbackPriceLabel} onChange={(e) => set('fallbackPriceLabel', e.target.value)} />}
                </Field>

                <Field label="Maximum featured per category">
                  {(p) => (
                    <Input
                      {...p}
                      type="number"
                      value={s.maxFeaturedPerCategory}
                      onChange={(e) => set('maxFeaturedPerCategory', Number(e.target.value))}
                    />
                  )}
                </Field>
              </div>
            )}

            {/* ------------------------------ Partners --------------------- */}
            {section === 'partners' && (
              <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
                <div>
                  <p className="stat__label" style={{ marginBottom: 6 }}>Tracked events</p>
                  <div className="chiplist">
                    {s.trackedEvents.map((event) => (
                      <span key={event} className="chip">{event}</span>
                    ))}
                  </div>
                  <p className="u-xs u-muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
                    These four are everything My30A can observe. Purchases, phone conversations and
                    checkout on a partner’s own website happen off-platform and are not tracked —
                    adding an event here would not change that.
                  </p>
                </div>

                <Row title="Weekly partner report" sub="Email each approved partner their views and clicks every Monday.">
                  <Switch checked={s.weeklyReportEnabled} onChange={(v) => set('weeklyReportEnabled', v)} label="Weekly partner report" />
                </Row>
                <Row title="Partners can edit their own listing" sub="Business details, photographs and hours.">
                  <Switch checked={s.allowSelfServiceEdits} onChange={(v) => set('allowSelfServiceEdits', v)} label="Partners can edit their listing" />
                </Row>
                <Row title="Edits need re-approval" sub="Changes go back into the review queue before guests see them.">
                  <Switch checked={s.requireApprovalOnEdit} onChange={(v) => set('requireApprovalOnEdit', v)} label="Edits need re-approval" />
                </Row>
              </div>
            )}

            {/* -------------------------------- Hosts ---------------------- */}
            {section === 'hosts' && (
              <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
                <Row
                  title="Setup required before publishing"
                  sub="A property cannot go live until the essential sections are filled in."
                >
                  <Switch checked={s.requireSetupBeforePublish} onChange={(v) => set('requireSetupBeforePublish', v)} label="Setup required before publishing" />
                </Row>

                <Field label="Minimum sections completed">
                  {(p) => (
                    <Input
                      {...p}
                      type="number"
                      value={s.minimumSetupSections}
                      onChange={(e) => set('minimumSetupSections', Number(e.target.value))}
                    />
                  )}
                </Field>

                <Row title="Hosts can share guest links" sub="Generate a link or QR code that unlocks the stay for a guest.">
                  <Switch checked={s.allowGuestLinkSharing} onChange={(v) => set('allowGuestLinkSharing', v)} label="Hosts can share guest links" />
                </Row>
                <Row
                  title="Subscription required"
                  sub="Off for now — the commercial model has not been finalised, and no host is blocked from the product yet."
                >
                  <Switch checked={s.subscriptionRequired} onChange={(v) => set('subscriptionRequired', v)} label="Subscription required" />
                </Row>
              </div>
            )}

            {/* ------------------------------ Security --------------------- */}
            {section === 'security' && (
              <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
                <Callout icon="alert" tone="warn">
                  None of these are enforced in this build. There is no authentication server, so
                  they describe the intended policy rather than applying it.
                </Callout>

                <Row title="Require two-factor authentication" sub="For every admin user, not just those who can reach payments.">
                  <Switch checked={s.requireTwoFactor} onChange={(v) => set('requireTwoFactor', v)} label="Require two-factor authentication" />
                </Row>

                <Grid cols={2}>
                  <Field label="Session length (hours)">
                    {(p) => (
                      <Input {...p} type="number" value={s.sessionHours} onChange={(e) => set('sessionHours', Number(e.target.value))} />
                    )}
                  </Field>
                  <Field label="Audit retention (days)">
                    {(p) => (
                      <Input
                        {...p}
                        type="number"
                        value={s.auditRetentionDays}
                        onChange={(e) => set('auditRetentionDays', Number(e.target.value))}
                      />
                    )}
                  </Field>
                </Grid>

                <Field label="IP allowlist" hint="One address or range per line. Empty means no restriction.">
                  {(p) => (
                    <Textarea {...p} rows={3} value={s.ipAllowlist} onChange={(e) => set('ipAllowlist', e.target.value)} />
                  )}
                </Field>
              </div>
            )}
          </Panel>

          <div className="tone-row">
            <Button onClick={save} loading={busy} icon="check">Save changes</Button>
            <Button variant="ghost" onClick={() => setDraft(data)}>Discard</Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={resetEverything}
        title="Reset all demo data?"
        message="Every approval, status change, edit and setting made in this session will be discarded and the shipped fixtures restored. Useful before a demo."
        confirmLabel="Reset everything"
        tone="danger"
      />
    </div>
  )
}
