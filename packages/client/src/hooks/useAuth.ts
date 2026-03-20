import { useState, useEffect } from 'react'
import { useMsal } from '@azure/msal-react'
import { msalInstance, apiScopes } from '@/auth/msalConfig'

export function useAuth() {
  const { accounts } = useMsal()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const account = accounts[0]
    if (!account) return
    msalInstance.acquireTokenSilent({ scopes: apiScopes, account })
      .then(({ accessToken }) => {
        const claims = JSON.parse(atob(accessToken.split('.')[1]))
        setIsAdmin((claims.roles ?? []).includes('admin'))
      })
      .catch(() => {})
  }, [accounts])

  return { isAdmin }
}
