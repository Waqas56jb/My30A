import Icon from '../ui/Icon'
import { qrImageSrc } from '../../data/areaGuide'

export default function BusinessCard({
  title,
  subtitle,
  brand,
  services = [],
  flipFront,
  flipBack,
  qrUrl,
  qrCaption,
}) {
  const qr = qrImageSrc(qrUrl, 280)

  return (
    <section className="biz-card" aria-labelledby="biz-card-heading">
      <header className="area-block__head">
        <p className="area-block__kicker">Print ready</p>
        <h2 id="biz-card-heading">{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>

      <article className="biz-card__digital">
        <div className="biz-card__digital-copy">
          <div className="biz-card__brand-row">
            <span className="biz-card__mark" aria-hidden="true">
              <Icon name="waves" />
            </span>
            <div>
              <p className="biz-card__logo">{brand.name}</p>
              <p className="biz-card__concierge">{brand.concierge}</p>
            </div>
          </div>
          <p className="biz-card__tagline">{brand.tagline}</p>
          <p className="biz-card__slogan">{brand.slogan}</p>
          <div className="biz-card__contact">
            <a href={brand.websiteUrl}>
              <Icon name="globe" />
              {brand.website}
            </a>
            <a href={brand.phoneHref}>
              <Icon name="phone" />
              {brand.phone}
            </a>
          </div>
        </div>
        <figure className="biz-card__qr">
          <img src={qr} alt={qrCaption} width={148} height={148} />
          <figcaption>{qrCaption}</figcaption>
        </figure>
      </article>

      <div className="biz-card__pair">
        <article className="biz-card__print biz-card__print--front" aria-label={flipFront}>
          <p className="biz-card__print-kicker">{flipFront}</p>
          <p className="biz-card__print-name">{brand.name}</p>
          <p className="biz-card__print-vitoria">{brand.concierge}</p>
          <p className="biz-card__print-tag">{brand.tagline}</p>
          <span className="biz-card__rule" aria-hidden="true" />
          <p className="biz-card__print-meta">
            {brand.website}
            <span aria-hidden="true"> · </span>
            {brand.phone}
          </p>
        </article>

        <article className="biz-card__print biz-card__print--services" aria-label={flipBack}>
          <p className="biz-card__print-kicker">{flipBack}</p>
          <span className="biz-card__mono" aria-hidden="true">
            M
          </span>
          <ul className="biz-card__services">
            {services.map((service) => (
              <li key={service.id}>
                <Icon name={service.icon} />
                <span>{service.label}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}
