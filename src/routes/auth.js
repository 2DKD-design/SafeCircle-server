import { Router } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { signToken, requireAuth } from '../middleware/auth.js'
import { sendPasswordResetEmail } from '../utils/mailer.js'

const router = Router()

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {}
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are all required.' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' })
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash })

    const token = signToken(user.id)
    res.status(201).json({ token, user: user.toJSON() })
  } catch (err) {
    console.error('[auth/signup]', err)
    res.status(500).json({ error: 'Could not create account.' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const token = signToken(user.id)
    res.json({ token, user: user.toJSON() })
  } catch (err) {
    console.error('[auth/login]', err)
    res.status(500).json({ error: 'Could not log in.' })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user.toJSON() })
})

// Change password while logged in (must know the current password).
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {}
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required.' })
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' })
    }

    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' })
    }

    req.user.passwordHash = await bcrypt.hash(newPassword, 10)
    await req.user.save()
    res.json({ ok: true })
  } catch (err) {
    console.error('[auth/change-password]', err)
    res.status(500).json({ error: 'Could not change your password.' })
  }
})

// Start the "forgot password" flow: always responds with the same generic
// message, whether or not the email exists, so this endpoint can't be used
// to discover which emails have accounts.
router.post('/forgot-password', async (req, res) => {
  const genericMessage = 'If an account exists for that email, a reset link has been sent.'
  try {
    const { email } = req.body || {}
    if (!email) {
      return res.status(400).json({ error: 'email is required.' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex')
      user.resetPasswordTokenHash = hashToken(rawToken)
      user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS)
      await user.save()

      const clientOrigin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0].trim()
      const resetUrl = `${clientOrigin}/reset-password?token=${rawToken}`
      try {
        await sendPasswordResetEmail(user.email, resetUrl)
      } catch (err) {
        console.error('[auth/forgot-password] failed to send email:', err.message)
      }
    }

    res.json({ message: genericMessage })
  } catch (err) {
    console.error('[auth/forgot-password]', err)
    res.status(500).json({ error: 'Could not process that request.' })
  }
})

// Complete the "forgot password" flow using the token emailed to the user.
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {}
    if (!token || !password) {
      return res.status(400).json({ error: 'token and password are required.' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' })
    }

    const user = await User.findOne({
      resetPasswordTokenHash: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordTokenHash +resetPasswordExpires')

    if (!user) {
      return res.status(400).json({ error: 'That reset link is invalid or has expired. Request a new one.' })
    }

    user.passwordHash = await bcrypt.hash(password, 10)
    user.resetPasswordTokenHash = null
    user.resetPasswordExpires = null
    await user.save()

    const newToken = signToken(user.id)
    res.json({ token: newToken, user: user.toJSON() })
  } catch (err) {
    console.error('[auth/reset-password]', err)
    res.status(500).json({ error: 'Could not reset your password.' })
  }
})

export default router
