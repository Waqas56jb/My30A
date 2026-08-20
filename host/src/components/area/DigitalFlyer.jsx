import Icon from '../ui/Icon'
import ShareActions from './ShareActions'
import { qrImageSrc } from '../../data/areaGuide'

export default function DigitalFlyer({
  title,
  subtitle,
  brand,
  flyer,
  communities = [],
  communitiesTitle,
  qrUrl,
}) {
  const qr = qrImageSrc(qrUrl, 240)

  return (
    <section className="flyer" aria-labelledby="flyer-heading">
      <header className="area-block__head">
        <p className="area-block__kicker">One-page guide</p>
        <h2 id="flyer-heading">{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>

      <article className="flyer__sheet">
        <div className="flyer__col flyer__col--brand">
          <div className="biz-card__brand-row">
            <span className="biz-card__mark" aria-hidden="true">
              <Icon name="waves" />
            </span>
            <div>
              <p className="flyer__logo">{brand.name}</p>
              <p className="flyer__concierge">{brand.concierge}</p>
            </div>
          </div>
          <p className="flyer__tagline">{brand.tagline}</p>
          <p className="flyer__line">{brand.flyerLine}</p>
          <span className="flyer__rule" aria-hidden="true" />
          <p className="flyer__list-label">Services</p>
          <ul className="flyer__services">
            {flyer.services.map((service) => (
              <li key={service.id}>
                <span>
                  {service.icon ? <Icon name={service.icon} /> : null}
                  {service.label}
                </span>
                <strong>{service.price}</strong>
              </li>
            ))}
          </ul>
          {flyer.golfNote ? <p className="flyer__note">{flyer.golfNote}</p> : null}
        </div>

        <div className="flyer__col flyer__col--map">
          <figure className="flyer__map">
            <img src={flyer.imageSrc} alt={flyer.imageAlt} />
            <figcaption>Scenic Highway 30A</figcaption>
          </figure>
        </div>

        <div className="flyer__col flyer__col--guide">
          <h3>{communitiesTitle}</h3>
          <ul className="flyer__towns">
            {communities.map((town) => (
              <li key={town.id}>
                <strong>{town.name}</strong>
                <span>{town.blurb}</span>
              </li>
            ))}
          </ul>
          <div className="flyer__foot">
            <figure className="flyer__qr">
              <img src={qr} alt={flyer.qrCaption} width={112} height={112} />
              <figcaption>{flyer.qrCaption}</figcaption>
            </figure>
            <div className="flyer__contact">
              <a className="flyer__web" href={brand.websiteUrl}>
                <Icon name="globe" />
                {brand.website}
              </a>
              <a className="flyer__email" href={brand.emailHref}>
                <Icon name="mail" />
                {brand.email}
              </a>
              <span className="flyer__soon">Instagram — {brand.instagram}</span>
              <span className="flyer__soon">Facebook — {brand.facebook}</span>
            </div>
          </div>
        </div>
      </article>

      <ShareActions
        title={brand.name}
        text={flyer.shareText}
        url={qrUrl}
        imageSrc={flyer.imageSrc}
        shareLabel={flyer.shareLabel}
        shareWhatsApp={flyer.shareWhatsApp}
        shareEmail={flyer.shareEmail}
        shareNative={flyer.shareNative}
        shareCopied={flyer.shareCopied}
      />
    </section>
  )
}
