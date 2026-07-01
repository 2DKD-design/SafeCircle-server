import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  })
}

// Verifies the Bearer token and attaches the full user document to req.user.
// Every route that needs an authenticated user should use this.
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const [scheme, token] = header.split(' ')
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header.' })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub)
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' })
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired, please log in again.' })
    }
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}
