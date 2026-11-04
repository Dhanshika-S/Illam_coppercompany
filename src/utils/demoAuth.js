const SESSION_KEY = 'illam-session'

function getDemoUser() {
  const session = window.localStorage.getItem(SESSION_KEY)
  if (!session) return null

  try {
    const parsed = JSON.parse(session)
    return parsed.user ? parsed : null
  } catch {
    return null
  }
}

function saveDemoUser(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ user: session.user }))
  window.dispatchEvent(new Event('illam:auth-changed'))
}

function clearDemoUser() {
  window.localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event('illam:auth-changed'))
}

export { clearDemoUser, getDemoUser, saveDemoUser }
