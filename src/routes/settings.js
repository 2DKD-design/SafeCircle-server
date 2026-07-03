import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  res.json({ user: req.user.toJSON() })
})

// Partial update. Body may include any of: name, phone, homeArea,
// avatarUrl, voiceSettings (object, merged shallowly), notificationPrefs
// (object, merged shallowly). Email/password/contacts are not changed here.
router.put('/', requireAuth, async (req, res) => {
  try {
    const { name, phone, homeArea, avatarUrl, voiceSettings, notificationPrefs } = req.body || {}
    const user = req.user

    if (name !== undefined) user.name = name
    if (phone !== undefined) user.phone = phone
    if (homeArea !== undefined) user.homeArea = homeArea
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl
    if (voiceSettings !== undefined) {
      user.voiceSettings = { ...user.voiceSettings.toObject(), ...voiceSettings }
    }
    if (notificationPrefs !== undefined) {
      user.notificationPrefs = { ...user.notificationPrefs.toObject(), ...notificationPrefs }
    }

    await user.save()
    res.json({ user: user.toJSON() })
  } catch (err) {
    console.error('[settings/put]', err)
    res.status(500).json({ error: 'Could not update settings.' })
  }
})

export default router
