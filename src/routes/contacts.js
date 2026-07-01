import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function serializeContacts(user) {
  return user.contacts.map((c) => c.toJSON())
}

router.get('/', requireAuth, async (req, res) => {
  res.json({ contacts: serializeContacts(req.user) })
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, phone, relation, priority } = req.body || {}
    if (!name || !phone) {
      return res.status(400).json({ error: 'name and phone are required.' })
    }

    const user = req.user
    user.contacts.push({ name, phone, relation: relation || '', priority: !!priority })
    await user.save()

    res.status(201).json({ contacts: serializeContacts(user) })
  } catch (err) {
    console.error('[contacts/post]', err)
    res.status(500).json({ error: 'Could not add contact.' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = req.user
    const before = user.contacts.length
    user.contacts = user.contacts.filter((c) => c.id !== req.params.id)

    if (user.contacts.length === before) {
      return res.status(404).json({ error: 'Contact not found.' })
    }

    await user.save()
    res.json({ contacts: serializeContacts(user) })
  } catch (err) {
    console.error('[contacts/delete]', err)
    res.status(500).json({ error: 'Could not remove contact.' })
  }
})

export default router
