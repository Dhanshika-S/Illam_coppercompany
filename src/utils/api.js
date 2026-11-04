const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api`

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new Error(
      `Cannot reach the Illam API at ${API_BASE_URL}. Start the backend and confirm MongoDB Atlas is reachable.`,
    )
  }

  const responseBody = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(responseBody?.message || `Request failed (${response.status}).`)
  }
  return responseBody
}

export { API_BASE_URL, apiRequest }
