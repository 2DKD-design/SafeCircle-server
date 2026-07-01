import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { signToken, requireAuth } from '../middleware/auth.js'

const router = Router()

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

export default router
