import jwt from 'jsonwebtoken'

function requireAuth(req, res, next) {
  const token = req.cookies?.illam_session
  if (!token) {
    return res.status(401).json({ message: 'Authentication is required.' })
  }

  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ message: 'Authentication is not configured.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (typeof payload !== 'object' || typeof payload.sub !== 'string') {
      return res.status(401).json({ message: 'Invalid authentication token.' })
    }

    req.userId = payload.sub
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired authentication token.' })
  }
}

export default requireAuth
