import { createContext } from 'react'

/**
 * Kept in its own file so Vite HMR of AdminContext.jsx does not create a
 * second context object. Lazy-loaded pages that import useAdmin after a hot
 * update would otherwise throw "must be used inside <AdminProvider>".
 */
export const AdminContext = createContext(null)
