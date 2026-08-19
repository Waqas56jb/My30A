import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/layout/AdminLayout'
import ErrorBoundary from './components/ErrorBoundary'
import RequireAdmin from './components/common/RequireAdmin'
import { SkeletonPage } from './components/ui/Skeleton'

/* The dashboard is where almost every session starts, so it loads eagerly.
   Everything else is split to keep the first paint quick. */
import Dashboard from './pages/dashboard/Dashboard'
import Login from './pages/auth/Login'

const Logout = lazy(() => import('./pages/auth/Logout'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))

const Operations = lazy(() => import('./pages/operations/Operations'))

const Guests = lazy(() => import('./pages/guests/Guests'))
const GuestDetail = lazy(() => import('./pages/guests/GuestDetail'))
const Hosts = lazy(() => import('./pages/hosts/Hosts'))
const HostDetail = lazy(() => import('./pages/hosts/HostDetail'))
const Partners = lazy(() => import('./pages/partners/Partners'))
const PartnerDetail = lazy(() => import('./pages/partners/PartnerDetail'))
const Properties = lazy(() => import('./pages/properties/Properties'))
const PropertyDetail = lazy(() => import('./pages/properties/PropertyDetail'))

const Categories = lazy(() => import('./pages/localGuide/Categories'))
const Listings = lazy(() => import('./pages/localGuide/Listings'))
const Restaurants = lazy(() => import('./pages/localGuide/Restaurants'))
const Featured = lazy(() => import('./pages/localGuide/Featured'))

const GroceryOrders = lazy(() => import('./pages/grocery/GroceryOrders'))
const GroceryDetail = lazy(() => import('./pages/grocery/GroceryDetail'))
const ServiceRequests = lazy(() => import('./pages/grocery/ServiceRequests'))
const Transfers = lazy(() => import('./pages/transfers/Transfers'))
const TransferDetail = lazy(() => import('./pages/transfers/TransferDetail'))

const VitoriaOverview = lazy(() => import('./pages/vitoria/VitoriaOverview'))
const Conversations = lazy(() => import('./pages/vitoria/Conversations'))
const ConversationDetail = lazy(() => import('./pages/vitoria/ConversationDetail'))
const Activity = lazy(() => import('./pages/vitoria/Activity'))
const Knowledge = lazy(() => import('./pages/vitoria/Knowledge'))
const Automation = lazy(() => import('./pages/vitoria/Automation'))

const Payments = lazy(() => import('./pages/payments/Payments'))
const Refunds = lazy(() => import('./pages/payments/Refunds'))
const Tips = lazy(() => import('./pages/payments/Tips'))
const Subscriptions = lazy(() => import('./pages/subscriptions/Subscriptions'))

const AnalyticsOverview = lazy(() => import('./pages/analytics/AnalyticsOverview'))
const GuestAnalytics = lazy(() => import('./pages/analytics/GuestAnalytics'))
const PartnerAnalytics = lazy(() => import('./pages/analytics/PartnerAnalytics'))
const ServiceAnalytics = lazy(() => import('./pages/analytics/ServiceAnalytics'))
const RevenueAnalytics = lazy(() => import('./pages/analytics/RevenueAnalytics'))

const Reviews = lazy(() => import('./pages/reviews/Reviews'))
const Notifications = lazy(() => import('./pages/notifications/Notifications'))
const Content = lazy(() => import('./pages/content/Content'))
const Media = lazy(() => import('./pages/media/Media'))
const Reports = lazy(() => import('./pages/reports/Reports'))
const Audit = lazy(() => import('./pages/audit/Audit'))
const AdminUsers = lazy(() => import('./pages/adminUsers/AdminUsers'))
const Profile = lazy(() => import('./pages/settings/Profile'))
const Settings = lazy(() => import('./pages/settings/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SkeletonPage />}>
        <Routes>
          {/* ------------------------- Auth ------------------------- */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/forgot-password" element={<ForgotPassword />} />
          {/* Unguarded on purpose — see Logout.jsx */}
          <Route path="/admin/logout" element={<Logout />} />

          {/* ------------------------ The panel --------------------- */}
          <Route
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/operations" element={<Operations />} />

            <Route path="/admin/guests" element={<Guests />} />
            <Route path="/admin/guests/:id" element={<GuestDetail />} />
            <Route path="/admin/hosts" element={<Hosts />} />
            <Route path="/admin/hosts/:id" element={<HostDetail />} />
            <Route path="/admin/partners" element={<Partners />} />
            <Route path="/admin/partners/:id" element={<PartnerDetail />} />
            <Route path="/admin/properties" element={<Properties />} />
            <Route path="/admin/properties/:id" element={<PropertyDetail />} />

            <Route path="/admin/local-guide" element={<Navigate to="/admin/local-guide/categories" replace />} />
            <Route path="/admin/local-guide/categories" element={<Categories />} />
            <Route path="/admin/local-guide/listings" element={<Listings />} />
            <Route path="/admin/local-guide/restaurants" element={<Restaurants />} />
            <Route path="/admin/local-guide/featured" element={<Featured />} />

            <Route path="/admin/grocery" element={<GroceryOrders />} />
            <Route path="/admin/grocery/:id" element={<GroceryDetail />} />
            <Route path="/admin/transfers" element={<Transfers />} />
            <Route path="/admin/transfers/:id" element={<TransferDetail />} />
            <Route path="/admin/service-requests" element={<ServiceRequests />} />

            <Route path="/admin/vitoria" element={<VitoriaOverview />} />
            <Route path="/admin/vitoria/conversations" element={<Conversations />} />
            <Route path="/admin/vitoria/conversations/:id" element={<ConversationDetail />} />
            <Route path="/admin/vitoria/activity" element={<Activity />} />
            <Route path="/admin/vitoria/knowledge" element={<Knowledge />} />
            <Route path="/admin/vitoria/automation" element={<Automation />} />

            <Route path="/admin/payments" element={<Payments />} />
            <Route path="/admin/payments/refunds" element={<Refunds />} />
            <Route path="/admin/payments/tips" element={<Tips />} />
            <Route path="/admin/subscriptions" element={<Subscriptions />} />

            <Route path="/admin/analytics" element={<AnalyticsOverview />} />
            <Route path="/admin/analytics/guests" element={<GuestAnalytics />} />
            <Route path="/admin/analytics/partners" element={<PartnerAnalytics />} />
            <Route path="/admin/analytics/services" element={<ServiceAnalytics />} />
            <Route path="/admin/analytics/revenue" element={<RevenueAnalytics />} />

            <Route path="/admin/reviews" element={<Reviews />} />
            <Route path="/admin/notifications" element={<Notifications />} />
            <Route path="/admin/content" element={<Content />} />
            <Route path="/admin/media" element={<Media />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/audit" element={<Audit />} />
            <Route path="/admin/admin-users" element={<AdminUsers />} />
            <Route path="/admin/profile" element={<Profile />} />
            <Route path="/admin/settings" element={<Settings />} />

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Aliases so a bare domain and older links never dead-end */}
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
