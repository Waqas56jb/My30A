import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

/**
 * Gate for anything that belongs to a person rather than to 30A.
 *
 * The destination itself — beaches, restaurants, experiences, events, the map,
 * Vitoria — stays open to everyone, because the public site has to sell the
 * place to people who have not booked. The moment a screen shows *your* data,
 * it goes behind this.
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
