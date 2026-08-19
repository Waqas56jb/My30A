import Icon from '../../components/ui/Icon'
import { Switch } from '../../components/ui/Form'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { Callout } from '../../components/ui/Display'
import { PageHeader, Panel, Grid, Stat, Facts } from '../../components/common/AdminUI'
import { Badge } from '../../components/ui/StatusBadge'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { formatDate, formatTime } from '../../utils/format'

/**
 * Scheduled Vitoria behaviours.
 *
 * Toggling one here changes local state and writes to the audit log. Nothing is
 * scheduled and nothing sends — there is no job runner and no mail service in
 * this build.
 */
export default function Automation() {
  useDocumentTitle('Automation')
  const { pushToast } = useAdmin()
  const { data, loading, error, reload } = useLoad(() => api.getAutomations(), [])

  if (loading) return <SkeletonGrid count={4} columns="grid--2" />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const rows = Array.isArray(data) ? data : []

  const toggle = async (automation) => {
    try {
      await api.toggleAutomation(automation.id, !automation.enabled)
      pushToast({
        tone: 'success',
        title: automation.enabled ? `${automation.name} paused` : `${automation.name} enabled`,
      })
      reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not change that', message: err.message })
    }
  }

  const when = (value) =>
    typeof value === 'string' && value.includes('T')
      ? `${formatDate(value)} at ${formatTime(value)}`
      : value

  return (
    <div className="apage">
      <PageHeader
        title="Automation"
        subtitle="Things Vitoria does without being asked — before arrival, after a delivery, once a stay ends."
      />

      <Callout icon="info">
        <strong style={{ display: 'block', marginBottom: 2 }}>Nothing runs in this build</strong>
        There is no scheduler and no mail or push provider connected. Toggles change local state and
        are recorded in the audit log so the workflow can be reviewed.
      </Callout>

      <div className="astats">
        <Stat label="Automations" value={rows.length} icon="send" tone="sea" />
        <Stat label="Enabled" value={rows.filter((a) => a.enabled).length} icon="checkCircle" tone="success" />
        <Stat label="Paused" value={rows.filter((a) => !a.enabled).length} icon="circle" tone="danger" />
        <Stat
          label="Runs this month"
          value={rows.reduce((sum, a) => sum + (Number(a.runsThisMonth) || 0), 0)}
          icon="refresh"
          tone="gold"
        />
      </div>

      <Grid cols={2}>
        {rows.map((automation) => (
          <Panel
            key={automation.id}
            title={automation.name}
            actions={
              <span className="tone-row">
                <Badge tone={automation.enabled ? 'success' : 'muted'} dot>
                  {automation.enabled ? 'Active' : 'Paused'}
                </Badge>
                <Switch
                  checked={automation.enabled}
                  onChange={() => toggle(automation)}
                  label={`${automation.enabled ? 'Disable' : 'Enable'} ${automation.name}`}
                />
              </span>
            }
          >
            <p className="u-small" style={{ marginTop: 0, lineHeight: 1.6, color: 'var(--ink-700)' }}>
              {automation.description}
            </p>

            <Facts
              columns={2}
              items={[
                { label: 'Trigger', value: automation.trigger },
                { label: 'Audience', value: automation.audience },
                { label: 'Last run', value: when(automation.lastRun) },
                { label: 'Next run', value: when(automation.nextRun) },
                { label: 'Runs this month', value: automation.runsThisMonth },
              ]}
            />
          </Panel>
        ))}
      </Grid>
    </div>
  )
}
