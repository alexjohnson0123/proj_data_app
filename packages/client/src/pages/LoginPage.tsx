import { useMsal } from '@azure/msal-react'
import { apiScopes } from '../auth/msalConfig.js'
import { Button } from '../components/ui/button'

export default function LoginPage() {
  const { instance } = useMsal()

  function handleLogin() {
    instance.loginRedirect({ scopes: apiScopes })
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Button onClick={handleLogin}>Log in</Button>
    </div>
  )
}
