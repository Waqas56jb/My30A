import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HostLayout from './layouts/HostLayout'
import ErrorBoundary from './components/ErrorBoundary'
import { SkeletonPage } from './components/ui/Skeleton'

/* Auth is the entry point, so it loads eagerly. */
import Login from './pages/auth/Login'

const Signup = lazy(() => import('./pages/auth/Signup'))

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Properties = lazy(() => import('./pages/Properties'))
const PropertyNew = lazy(() => import('./pages/PropertyNew'))
const PropertyLayout = lazy(() => import('./pages/property/PropertyLayout'))
const PropertyOverview = lazy(() => import('./pages/property/Overview'))
const PropertyPhotos = lazy(() => import('./pages/property/Photos'))
const PropertyRecommendations = lazy(() => import('./pages/property/Recommendations'))
const GuestAccess = lazy(() => import('./pages/property/GuestAccess'))
const PropertyPreview = lazy(() => import('./pages/property/Preview'))
const Guests = lazy(() => import('./pages/Guests'))
const GuestDetail = lazy(() => import('./pages/GuestDetail'))
const Vitoria = lazy(() => import('./pages/Vitoria'))
const Activity = lazy(() => import('./pages/Activity'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const Help = lazy(() => import('./pages/Help'))
const NotFound = lazy(() => import('./pages/NotFound'))

/* Auth screens that live in one module. */
const ForgotPassword = lazy(() =>
  import('./pages/auth/PasswordPages').then((m) => ({ default: m.ForgotPassword })),
)
const ResetPassword = lazy(() =>
  import('./pages/auth/PasswordPages').then((m) => ({ default: m.ResetPassword })),
)
const VerifyEmail = lazy(() =>
  import('./pages/auth/PasswordPages').then((m) => ({ default: m.VerifyEmail })),
)

/* Property section forms all live in one module. */
const section = (name) =>
  lazy(() => import('./pages/property/Sections').then((m) => ({ default: m[name] })))

const InformationSection = section('InformationSection')
const WifiSection = section('WifiSection')
const CheckInSection = section('CheckInSection')
const CheckOutSection = section('CheckOutSection')
const RulesSection = section('RulesSection')
const ParkingSection = section('ParkingSection')
const EmergencySection = section('EmergencySection')
const VitoriaSection = section('VitoriaSection')

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SkeletonPage />}>
        <Routes>
          {/* ------------------------ Unauthenticated ------------------------ */}
          <Route path="/host/login" element={<Login />} />
          <Route path="/host/signup" element={<Signup />} />
          <Route path="/host/forgot-password" element={<ForgotPassword />} />
          <Route path="/host/reset-password" element={<ResetPassword />} />

          {/* -------------------------- Authenticated ------------------------ */}
          <Route element={<HostLayout />}>
            <Route path="/host/verify-email" element={<VerifyEmail />} />
            <Route path="/host/onboarding" element={<Onboarding />} />
            <Route path="/host/dashboard" element={<Dashboard />} />

            <Route path="/host/properties" element={<Properties />} />
            <Route path="/host/properties/new" element={<PropertyNew />} />
            <Route path="/host/properties/:id" element={<PropertyLayout />}>
              <Route index element={<PropertyOverview />} />
              <Route path="information" element={<InformationSection />} />
              <Route path="wifi" element={<WifiSection />} />
              <Route path="check-in" element={<CheckInSection />} />
              <Route path="check-out" element={<CheckOutSection />} />
              <Route path="rules" element={<RulesSection />} />
              <Route path="parking" element={<ParkingSection />} />
              <Route path="emergency" element={<EmergencySection />} />
              <Route path="recommendations" element={<PropertyRecommendations />} />
              <Route path="photos" element={<PropertyPhotos />} />
              <Route path="guest-access" element={<GuestAccess />} />
              <Route path="vitoria" element={<VitoriaSection />} />
              <Route path="preview" element={<PropertyPreview />} />
            </Route>

            <Route path="/host/guests" element={<Guests />} />
            <Route path="/host/guests/:id" element={<GuestDetail />} />
            <Route path="/host/vitoria" element={<Vitoria />} />
            <Route path="/host/activity" element={<Activity />} />
            <Route path="/host/analytics" element={<Analytics />} />
            <Route path="/host/notifications" element={<Notifications />} />
            <Route path="/host/profile" element={<Profile />} />
            <Route path="/host/settings" element={<Settings />} />
            <Route path="/host/help" element={<Help />} />

            <Route path="/host/recommendations" element={<Navigate to="/host/properties" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Anything outside /host lands on the dashboard. */}
          <Route path="/" element={<Navigate to="/host/dashboard" replace />} />
          <Route path="/host" element={<Navigate to="/host/dashboard" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
