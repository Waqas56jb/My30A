import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import PortalLayout from './layouts/PortalLayout'
import ErrorBoundary from './components/ErrorBoundary'
import { SkeletonPage } from './components/ui/Skeleton'

/* Login is the entry point, so it loads eagerly. */
import Login from './pages/auth/Login'

const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const Photos = lazy(() => import('./pages/Photos'))
const Preview = lazy(() => import('./pages/Preview'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Settings = lazy(() => import('./pages/Settings'))
const Help = lazy(() => import('./pages/Help'))
const NotFound = lazy(() => import('./pages/NotFound'))

const ForgotPassword = lazy(() =>
  import('./pages/auth/PasswordPages').then((m) => ({ default: m.ForgotPassword })),
)
const ResetPassword = lazy(() =>
  import('./pages/auth/PasswordPages').then((m) => ({ default: m.ResetPassword })),
)

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SkeletonPage />}>
        <Routes>
          {/* ------------------------- Public ------------------------- */}
          <Route path="/partner/login" element={<Login />} />
          <Route path="/partner/register" element={<Register />} />
          <Route path="/partner/forgot-password" element={<ForgotPassword />} />
          <Route path="/partner/reset-password" element={<ResetPassword />} />

          {/* ----------------------- Authenticated -------------------- */}
          <Route element={<PortalLayout />}>
            <Route path="/partner/dashboard" element={<Dashboard />} />
            <Route path="/partner/profile" element={<Profile />} />
            <Route path="/partner/photos" element={<Photos />} />
            <Route path="/partner/preview" element={<Preview />} />
            <Route path="/partner/analytics" element={<Analytics />} />
            <Route path="/partner/notifications" element={<Notifications />} />
            <Route path="/partner/settings" element={<Settings />} />
            <Route path="/partner/help" element={<Help />} />

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Anything outside /partner lands on the dashboard. */}
          <Route path="/" element={<Navigate to="/partner/dashboard" replace />} />
          <Route path="/partner" element={<Navigate to="/partner/dashboard" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
