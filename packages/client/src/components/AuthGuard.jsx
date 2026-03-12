import { useIsAuthenticated } from '@azure/msal-react'
import LoginPage from '../pages/LoginPage.jsx'

export default function AuthGuard({ children }) {
  const isAuthenticated = useIsAuthenticated()

  if (!isAuthenticated) return <LoginPage />

  return children
}
