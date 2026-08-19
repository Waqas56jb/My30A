import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

/**
 * Gate for anything that belongs to a person rather than to 30A.
 *
 * The guest dashboard (sidebar, Vitoria, restaurants, stay tools) sits behind
 * this. The marketing site stays public. After login, the guest continues to
 * the page they asked for.
 *
 * Where the guest was heading is preserved in `state.from`, so logging in
 * continues the journey instead of dumping them on the home screen.
 */
export default function RequireAuth({ children }) {
  const { isAuthed } = useApp()
  const location = useLocation()

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return children
}
