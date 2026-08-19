import PageHeader from '../components/ui/PageHeader'
import AreaMap from '../components/area/AreaMap'
import BusinessCard from '../components/area/BusinessCard'
import DigitalFlyer from '../components/area/DigitalFlyer'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAsync } from '../hooks/useAsync'
import { AREA_GUIDE } from '../data/areaGuide'
import { api } from '../services/api'

function toAccessPoints(payload) {
  return (payload?.access ?? []).map((point) => ({
    id: point.slug || point.id,
    name: point.name,
    community: point.neighborhood,
    type: point.useClass === 'private' ? 'private' : point.useClass === 'limited_public' ? 'limited' : 'public',
    note: [point.useLabel, point.description].filter(Boolean).join(' — '),
  }))
}

export default function AreaGuide({ copy = AREA_GUIDE }) {
  useDocumentTitle(copy.pageTitle)
  const access = useAsync(() => api('/public/beach-access'), [])
  const accessPoints = access.data ? toAccessPoints(access.data) : copy.accessPoints

  return (
    <div className="hpage area-guide" style={{ maxWidth: 1100 }}>
      <PageHeader title={copy.pageTitle} subtitle={copy.pageSubtitle} />
      {copy.intro ? <p className="area-guide__intro">{copy.intro}</p> : null}

      <AreaMap
        areaLabel={copy.areaLabel}
        maps={copy.maps}
        mapHint={copy.mapHint}
        zoomInLabel={copy.zoomInLabel}
        zoomOutLabel={copy.zoomOutLabel}
        resetLabel={copy.resetLabel}
        accessTitle={copy.accessTitle}
        accessSubtitle={copy.accessSubtitle}
        accessAllLabel={copy.accessAllLabel}
        accessPublicLabel={copy.accessPublicLabel}
        accessPrivateLabel={copy.accessPrivateLabel}
        accessPublicShort={copy.accessPublicShort}
        accessPrivateShort={copy.accessPrivateShort}
        accessLimitedLabel={copy.accessLimitedLabel}
        accessLimitedShort={copy.accessLimitedShort}
        accessPoints={accessPoints}
        locationsTitle={copy.locationsTitle}
        locations={[]}
      />

      <BusinessCard
        title={copy.card.title}
        subtitle={copy.card.subtitle}
        brand={copy.brand}
        services={copy.card.services}
        flipFront={copy.card.flipFront}
        flipBack={copy.card.flipBack}
        qrUrl={copy.app.downloadUrl}
        qrCaption={copy.flyer.qrCaption}
      />

      <DigitalFlyer
        title={copy.flyer.title}
        subtitle={copy.flyer.subtitle}
        brand={copy.brand}
        flyer={copy.flyer}
        communities={copy.communities}
        communitiesTitle={copy.communitiesTitle}
        qrUrl={copy.app.downloadUrl}
      />
    </div>
  )
}
