import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import MarketingLayout from './layouts/MarketingLayout'
import ErrorBoundary from './components/ErrorBoundary'
import RequireGuest from './components/RequireGuest'
import { SkeletonPage } from './components/ui/Skeleton'

/* The landing page is the front door of the website, so it loads eagerly.
   Everything else is split to keep first paint fast on mobile. */
import Landing from './pages/Landing'
import GuestLink from './pages/GuestLink'

const Discover = lazy(() => import('./pages/Discover'))
const Access = lazy(() => import('./pages/Access'))
const Vitoria = lazy(() => import('./pages/Vitoria'))
const Explore = lazy(() => import('./pages/Explore'))
const ExperienceDetail = lazy(() => import('./pages/ExperienceDetail'))
const Restaurants = lazy(() => import('./pages/Restaurants'))
const Partners = lazy(() => import('./pages/Partners'))
const PlaceDetail = lazy(() => import('./pages/PlaceDetail'))
const Beaches = lazy(() => import('./pages/Beaches'))
const BeachDetail = lazy(() => import('./pages/BeachDetail'))
const Events = lazy(() => import('./pages/Events'))
const EventDetail = lazy(() => import('./pages/EventDetail'))
const MapPage = lazy(() => import('./pages/MapPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const Favorites = lazy(() => import('./pages/Favorites'))
const Help = lazy(() => import('./pages/Help'))
const Services = lazy(() => import('./pages/Services'))
const Groceries = lazy(() => import('./pages/Groceries'))
const GroceryNew = lazy(() => import('./pages/GroceryNew'))
const GroceryDetail = lazy(() => import('./pages/GroceryDetail'))
const Transfers = lazy(() => import('./pages/Transfers'))
const TransferNew = lazy(() => import('./pages/TransferNew'))
const TransferDetail = lazy(() => import('./pages/TransferDetail'))
const MyStay = lazy(() => import('./pages/MyStay'))
const MyTrip = lazy(() => import('./pages/MyTrip'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))

/** Property-specific screens ask for an access code first. */
const guarded = (element, props) => <RequireGuest {...props}>{element}</RequireGuest>

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SkeletonPage />}>
        <Routes>
          {/* Standalone entry points */}
          <Route path="/access" element={<Access />} />
          <Route path="/guest/:guestId" element={<GuestLink />} />
          {/* Older host-generated links used /stay/:slug. Keep them working. */}
          <Route path="/stay/:guestId" element={<GuestLink />} />

          {/* ---------------- The public website ---------------- */}
          {/* Header + hero + footer, no app chrome. This is what a first-time
              visitor sees; the app shell begins once they step inside. */}
          <Route element={<MarketingLayout />}>
            <Route index element={<Landing />} />
          </Route>

          <Route element={<AppLayout />}>
            {/* ---------------- Browse the destination ---------------- */}
            <Route path="/discover" element={<Discover />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/experiences/:slug" element={<ExperienceDetail />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/help" element={<Help />} />
            <Route path="/vitoria" element={<Vitoria />} />

            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/restaurants/:id" element={<PlaceDetail kind="restaurant" />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/partners/:id" element={<PlaceDetail kind="partner" />} />
            <Route path="/beaches" element={<Beaches />} />
            <Route path="/beaches/:id" element={<BeachDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />

            {/* ---------------- Guest: their stay ---------------- */}
            <Route
              path="/my-stay"
              element={guarded(<MyStay />, {
                title: 'Your property details live here',
                message:
                  'WiFi, door code, parking, house rules, check-out steps, and your host’s number — all of it appears once you enter the code your host sent.',
              })}
            />
            <Route path="/my-trip" element={guarded(<MyTrip />)} />
            <Route path="/profile" element={guarded(<Profile />)} />
            <Route
              path="/services"
              element={guarded(<Services />, {
                title: 'Concierge services need your stay',
                message:
                  'Grocery delivery and airport transfers are tied to your property and dates. Unlock your stay and you can request both in a couple of taps.',
              })}
            />
            <Route path="/groceries" element={guarded(<Groceries />)} />
            <Route path="/groceries/new" element={guarded(<GroceryNew />)} />
            <Route path="/groceries/:id" element={guarded(<GroceryDetail />)} />
            <Route path="/transfers" element={guarded(<Transfers />)} />
            <Route path="/transfers/new" element={guarded(<TransferNew />)} />
            <Route path="/transfers/:id" element={guarded(<TransferDetail />)} />

            {/* ---------------- Open to everyone ---------------- */}
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />

            {/* Aliases kept so older links never dead-end */}
            <Route path="/home" element={<Navigate to="/discover" replace />} />
            <Route path="/orders" element={<Navigate to="/services" replace />} />
            <Route path="/property" element={<Navigate to="/my-stay" replace />} />
            <Route path="/login" element={<Navigate to="/access" replace />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
