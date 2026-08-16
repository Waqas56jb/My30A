import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { PHOTO, hero } from '../assets/images'
import { mockGuests } from '../data/mockGuests'
import { getPropertyById } from '../data/mockProperties'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatDateRange } from '../utils/format'

/**
 * Entry point for the prototype. In production a guest arrives on their own
 * unique link (/guest/:guestId) sent by the host after booking, so this
 * screen exists to demonstrate that resolution — it is not a marketing page.
 */
export default function Landing() {
  const navigate = useNavigate()
  const { setGuestSlug } = useApp()
  useDocumentTitle('Welcome')

  const openGuest = (slug) => {
    setGuestSlug(slug)
    navigate(`/guest/${slug}`)
  }

  return (
    <div className="landing">
      <div className="landing__bg" aria-hidden="true">
        <img src={hero(PHOTO.beachSunset)} alt="" />
      </div>
      <div className="landing__scrim" aria-hidden="true" />

      <div className="landing__inner">
        <span className="landing__mark" aria-hidden="true">
          <Icon name="waves" style={{ width: 26, height: 26 }} />
        </span>

        <div>
          <p className="u-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>
            My30A Host
          </p>
          <h1 className="landing__title">
            Your personal concierge
            <br />
            for 30A.
          </h1>
          <p className="landing__sub" style={{ marginTop: 12 }}>
            Vitoria knows your house, your stay, and this stretch of coast. Open the link your
            host sent you to begin.
          </p>
        </div>

        <div className="landing__links">
          {mockGuests.map((guest) => {
            const property = getPropertyById(guest.propertyId)
            return (
              <button
                key={guest.id}
                type="button"
                className="landing__demo"
                onClick={() => openGuest(guest.slug)}
              >
                <Icon name="key" style={{ width: 20, height: 20, opacity: 0.8 }} />
                <span className="u-grow" style={{ minWidth: 0 }}>
                  <span className="landing__demo-name">
                    {guest.firstName} · {property?.name}
                  </span>
                  <span className="landing__demo-sub">
                    {formatDateRange(guest.stay.checkInDate, guest.stay.checkOutDate)} ·
                    /guest/{guest.slug}
                  </span>
                </span>
                <Icon name="arrowRight" style={{ width: 18, height: 18 }} />
              </button>
            )
          })}

          <Button block size="lg" to="/home" iconRight="arrowRight">
            Continue to the demo stay
          </Button>
        </div>

        <p className="landing__note">
          Frontend prototype · mock data only · no account required.{' '}
          <Link to="/guest/demo" style={{ textDecoration: 'underline' }}>
            /guest/demo
          </Link>
        </p>
      </div>
    </div>
  )
}
