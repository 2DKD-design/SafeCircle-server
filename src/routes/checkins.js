import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import CheckInLog from '../models/CheckInLog.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const log = await CheckInLog.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100)
    res.json({
      activeCheckIn: req.user.activeCheckIn || null,
      checkInLog: log.map((l) => l.toJSON()),
    })
  } catch (err) {
    console.error('[checkins/get]', err)
    res.status(500).json({ error: 'Could not load check-ins.' })
  }
})

router.post('/start', requireAuth, async (req, res) => {
  try {
    const { minutes, note } = req.body || {}
    if (!minutes || minutes <= 0) {
      return res.status(400).json({ error: 'minutes must be a positive number.' })
    }

    const user = req.user
    const startedAt = Date.now()
    const endsAt = startedAt + minutes * 60 * 1000
    user.activeCheckIn = {
      startedAt,
      endsAt,
      minutes,
      note: note || '',
      contactsNotified: user.contacts.filter((c) => c.priority).length,
    }
    await user.save()

    res.status(201).json({ activeCheckIn: user.activeCheckIn })
  } catch (err) {
    console.error('[checkins/start]', err)
    res.status(500).json({ error: 'Could not start check-in.' })
  }
})

// status: 'safe' (user confirmed they're okay), 'sos' (user escalated),
// or 'expired' (timer ran out with no response).
router.post('/end', requireAuth, async (req, res) => {
  try {
    const { status } = req.body || {}
    if (!['safe', 'sos', 'expired'].includes(status)) {
      return res.status(400).json({ error: "status must be 'safe', 'sos', or 'expired'." })
    }

    const user = req.user
    const current = user.activeCheckIn
    if (!current) {
      return res.status(404).json({ error: 'No active check-in.' })
    }

    const entry = await CheckInLog.create({
      user: user._id,
      startedAt: current.startedAt,
      endedAt: Date.now(),
      status,
      note: current.note,
    })
    user.activeCheckIn = null
    await user.save()

    res.json({ entry: entry.toJSON() })
  } catch (err) {
    console.error('[checkins/end]', err)
    res.status(500).json({ error: 'Could not end check-in.' })
  }
})

export default router
