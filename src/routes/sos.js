import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import SosEvent from '../models/SosEvent.js'
import { sendPushToTokens } from '../utils/firebaseAdmin.js'

const router = Router()

router.post('/trigger', requireAuth, async (req, res) => {
  try {
    const { lat, lng, accuracy, source } = req.body || {}
    const user = req.user
    const priorityCount = user.contacts.filter((c) => c.priority).length

    const event = await SosEvent.create({
      user: user._id,
      lat,
      lng,
      accuracy,
      source: source || 'manual',
      contactsNotified: priorityCount,
      status: 'sent',
    })

    // Best-effort confirmation push to the user's own devices. Actually
    // notifying the emergency contacts (SMS/call/push to *their* phones)
    // needs a provider like Twilio or each contact having their own
    // account/device token — that's a follow-up integration, not wired
    // up here.
    if (user.notificationPrefs?.push) {
      const mapsLink = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : 'location unavailable'
      sendPushToTokens(user.fcmTokens, {
        title: 'SOS sent',
        body: `Your alert was recorded (${mapsLink}).`,
        data: { type: 'sos', sosId: event.id },
      }).catch((err) => console.warn('[sos/trigger] push failed:', err.message))
    }

    res.status(201).json({ sos: event.toJSON() })
  } catch (err) {
    console.error('[sos/trigger]', err)
    res.status(500).json({ error: 'Could not trigger SOS.' })
  }
})

router.get('/history', requireAuth, async (req, res) => {
  try {
    const events = await SosEvent.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100)
    res.json({ history: events.map((e) => e.toJSON()) })
  } catch (err) {
    console.error('[sos/history]', err)
    res.status(500).json({ error: 'Could not load SOS history.' })
  }
})

export default router
