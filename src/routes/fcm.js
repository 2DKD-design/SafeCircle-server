import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/register', requireAuth, async (req, res) => {
  try {
    const { token } = req.body || {}
    if (!token) return res.status(400).json({ error: 'token is required.' })

    const user = req.user
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token)
      await user.save()
    }
    res.status(201).json({ ok: true })
  } catch (err) {
    console.error('[fcm/register]', err)
    res.status(500).json({ error: 'Could not register push token.' })
  }
})

router.post('/unregister', requireAuth, async (req, res) => {
  try {
    const { token } = req.body || {}
    if (!token) return res.status(400).json({ error: 'token is required.' })

    const user = req.user
    user.fcmTokens = user.fcmTokens.filter((t) => t !== token)
    await user.save()
    res.json({ ok: true })
  } catch (err) {
    console.error('[fcm/unregister]', err)
    res.status(500).json({ error: 'Could not unregister push token.' })
  }
})

export default router
