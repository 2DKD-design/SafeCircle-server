import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import Alert from '../models/Alert.js'

const router = Router()

const SEVERITIES = ['critical', 'warning', 'info']

// Alerts are shared community data — every signed-in user sees the same
// feed, minus whatever they've personally dismissed.
router.get('/', requireAuth, async (req, res) => {
  try {
    const dismissed = req.user.dismissedAlertIds || []
    const alerts = await Alert.find({ _id: { $nin: dismissed } }).sort({ createdAt: -1 }).limit(200)
    res.json({ alerts: alerts.map((a) => a.toJSON()) })
  } catch (err) {
    console.error('[alerts/get]', err)
    res.status(500).json({ error: 'Could not load alerts.' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, body, place, severity, sourceUrl } = req.body || {}
    if (!title || !place) {
      return res.status(400).json({ error: 'title and place are required.' })
    }

    const alert = await Alert.create({
      title,
      body: body || '',
      place,
      severity: SEVERITIES.includes(severity) ? severity : 'warning',
      sourceUrl: sourceUrl || '',
      verified: false,
      reportedBy: req.user._id,
    })

    res.status(201).json({ alert: alert.toJSON() })
  } catch (err) {
    console.error('[alerts/post]', err)
    res.status(500).json({ error: 'Could not post alert.' })
  }
})

// Dismiss is per-user: it hides the alert from this account's feed without
// deleting it for anyone else.
router.post('/:id/dismiss', requireAuth, async (req, res) => {
  try {
    const user = req.user
    if (!user.dismissedAlertIds.includes(req.params.id)) {
      user.dismissedAlertIds.push(req.params.id)
      await user.save()
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('[alerts/dismiss]', err)
    res.status(500).json({ error: 'Could not dismiss alert.' })
  }
})

export default router
