import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import ErrorBoundary from './components/ErrorBoundary'
import { SkeletonPage } from './components/ui/Skeleton'

/* Landing and the guest-link resolver load eagerly — they are the entry
   points. Everything else is split so first paint stays fast on mobile. */
import Landing from './pages/Landing'
import GuestLink from './pages/GuestLink'

const Home = lazy(() => import('./pages/Home'))
const Vitoria = lazy(() => import('./pages/Vitoria'))
const Explore = lazy(() => import('./pages/Explore'))
const Restaurants = lazy(() => import('./pages/Restaurants'))
const Partners = lazy(() => import('./pages/Partners'))
const PlaceDetail = lazy(() => import('./pages/PlaceDetail'))
const Beaches = lazy(() => import('./pages/Beaches'))
const BeachDetail = lazy(() => import('./pages/BeachDetail'))
const Events = lazy(() => import('./pages/Events'))
const EventDetail = lazy(() => import('./pages/EventDetail'))
const MapPage = lazy(() => import('./pages/MapPage'))
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

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SkeletonPage />}>
        <Routes>
          {/* Entry points */}
          <Route path="/" element={<Landing />} />
          <Route path="/guest/:guestId" element={<GuestLink />} />

          {/* The guest experience */}
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/vitoria" element={<Vitoria />} />

            <Route path="/explore" element={<Explore />} />
            <Route path="/map" element={<MapPage />} />

            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/restaurants/:id" element={<PlaceDetail kind="restaurant" />} />

            <Route path="/partners" element={<Partners />} />
            <Route path="/partners/:id" element={<PlaceDetail kind="partner" />} />

            <Route path="/beaches" element={<Beaches />} />
            <Route path="/beaches/:id" element={<BeachDetail />} />

            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />

            <Route path="/services" element={<Services />} />
            <Route path="/groceries" element={<Groceries />} />
            <Route path="/groceries/new" element={<GroceryNew />} />
            <Route path="/groceries/:id" element={<GroceryDetail />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/transfers/new" element={<TransferNew />} />
            <Route path="/transfers/:id" element={<TransferDetail />} />

            <Route path="/my-stay" element={<MyStay />} />
            <Route path="/my-trip" element={<MyTrip />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />

            {/* Legacy / convenience aliases */}
            <Route path="/orders" element={<Navigate to="/services" replace />} />
            <Route path="/property" element={<Navigate to="/my-stay" replace />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
