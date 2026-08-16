import { useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button, { IconButton } from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { Section, Callout, ImageGallery } from '../components/ui/Display'
import { Breadcrumbs } from '../components/ui/PageHeader'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { PartnerCard } from '../components/cards/PlaceCard'
import ExperienceTile from '../components/cards/ExperienceTile'
import SiteFooter from '../components/SiteFooter'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { hero } from '../assets/images'
import { experiences, getExperience } from '../data/mockExperiences'

/**
 * `/experiences/:slug` — the lifestyle page.
 *
 * Photograph and invitation first; the local businesses who make it happen
 * come second. Providers are a directory, not a booking funnel: the guest
 * leaves to the partner's own site or phone.
 */
export default function ExperienceDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const experience = getExperience(slug)

  useDocumentTitle(experience?.label)

  const partners = useAsync(
    async () => {
      if (!experience?.partnerCategories?.length) return []
      const lists = await Promise.all(
        experience.partnerCategories.map((category) => api.getPartners({ category })),
      )
      return lists.flat()
    },
    [slug],
    { skip: !experience },
  )

  const related = useMemo(
    () => experiences.filter((e) => e.slug !== slug).slice(0, 4),
    [slug],
  )

  if (!experience) return <Navigate to="/explore" replace />

  return (
    <div className="page page--flush">
      {/* ------------------------------ Hero ------------------------------ */}
      <header className="exp-hero">
        <div className="dhero__media" aria-hidden="true">
          <img src={hero(experience.image)} alt="" />
        </div>
        <div className="dhero__scrim" aria-hidden="true" />

        <div className="exp-hero__nav">
          <IconButton icon="arrowLeft" label="Go back" variant="glass" onClick={() => navigate(-1)} />
        </div>

        <div className="exp-hero__inner">
          <span className="dhero__kicker">
            <Icon name={experience.icon} size={13} />
            {experience.label}
          </span>
          <h1 className="exp-hero__tagline">{experience.headline}</h1>
          <p className="dhero__sub" style={{ marginTop: 'var(--sp-3)' }}>
            {experience.tagline}
          </p>
        </div>
      </header>

      <div className="home-inner" style={{ paddingTop: 'var(--sp-6)' }}>
        <Breadcrumbs
          items={[
            { label: 'Explore', to: '/explore' },
            { label: 'Experiences', to: '/explore' },
            { label: experience.label },
          ]}
        />

        {/* ------------------------- Introduction ------------------------ */}
        <div className="spotlight" style={{ marginTop: 'var(--sp-4)' }}>
          <div>
            <p className="prose" style={{ fontSize: '1.05rem' }}>
              {experience.blurb}
            </p>
            <ul className="spotlight__list">
              {experience.highlights.map((item) => (
                <li key={item}>
                  <Icon name="check" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="u-row u-wrap" style={{ marginTop: 'var(--sp-5)' }}>
              <Button to="/vitoria" state={{ prompt: experience.prompt }} icon="sparkles">
                Ask Vitoria about this
              </Button>
              <Button variant="secondary" to="/map" icon="map">
                See it on the map
              </Button>
            </div>
          </div>

          <div className="spotlight__media">
            <SmartImage
              photoId={experience.gallery?.[1] ?? experience.image}
              alt={experience.label}
              ratio="4x3"
              width={900}
            />
          </div>
        </div>

        {/* --------------------------- Providers ------------------------- */}
        {experience.partnerCategories.length > 0 && (
          <Section
            title="Who to call"
            subtitle="Independent local businesses. You book with them directly."
            id="providers"
          >
            {partners.loading && <SkeletonGrid count={3} columns="grid--3" />}
            {partners.error && <ErrorState error={partners.error} onRetry={partners.reload} />}
            {!partners.loading && !partners.error && (partners.data ?? []).length === 0 && (
              <EmptyState
                icon="sparkles"
                title="No partners listed yet"
                message="We are still adding businesses to this category. Vitoria can find someone locally in the meantime."
                actionLabel="Ask Vitoria"
                actionTo="/vitoria"
              />
            )}
            {!partners.loading && (partners.data ?? []).length > 0 && (
              <div className="grid grid--3">
                {(partners.data ?? []).map((partner) => (
                  <PartnerCard key={partner.id} item={partner} />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ---------------------------- Gallery -------------------------- */}
        {experience.gallery?.length > 1 && (
          <Section title={`${experience.label} on 30A`} id="gallery">
            <ImageGallery images={experience.gallery} alt={experience.label} />
          </Section>
        )}

        <Callout icon="info" className="section">
          My30A introduces you to these businesses and tracks nothing more than the fact you tapped
          through. Availability, booking, and payment are handled by the partner directly.
        </Callout>

        {/* ------------------------ Keep exploring ----------------------- */}
        <Section title="Keep exploring" id="related">
          <div className="exp-grid">
            {related.map((item) => (
              <ExperienceTile key={item.slug} experience={item} />
            ))}
          </div>
        </Section>

        <SiteFooter />
      </div>
    </div>
  )
}
