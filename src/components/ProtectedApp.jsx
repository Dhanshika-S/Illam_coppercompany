import { useEffect, useState } from 'react'
import { apiRequest } from '../utils/api.js'
import { clearDemoUser, saveDemoUser } from '../utils/demoAuth.js'

function ProtectedApp({ children }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    apiRequest('/auth/me')
      .then((session) => {
        saveDemoUser(session)
        setReady(true)
      })
      .catch(() => {
        clearDemoUser()
        window.location.replace('/login.html')
      })

  }, [])

  if (!ready) return null
  return children
}

export default ProtectedApp
