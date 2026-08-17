import { Navigate, useLocation } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'

/**
 * Everything except the login screens sits behind this.
 *
 * Where the operator was heading is preserved in `state.from`, so signing in
 * continues to the refund they were opening rather than dumping them on the
 * dashboard.
 */
export default function RequireAdmin({ children }) {
  const { isAuthed } = useAdmin()
  const location = useLocation()

  if (!isAuthed) {
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />
    )
  }
  return children
}
