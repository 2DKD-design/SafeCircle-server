import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function serializeRoutes(user) {
  return user.routes.map((r) => r.toJSON())
}

router.get('/', requireAuth, async (req, res) => {
  res.json({ routes: serializeRoutes(req.user) })
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, from, to, fromPoint, toPoint, travelMode, rating, lastUsed } = req.body || {}
    if (!name || !from || !to) {
      return res.status(400).json({ error: 'name, from and to are required.' })
    }

    const user = req.user
    user.routes.unshift({
      name,
      from,
      to,
      fromPoint: fromPoint || null,
      toPoint: toPoint || null,
      travelMode: travelMode || 'walking',
      rating: rating ?? '—',
      lastUsed: lastUsed || new Date().toLocaleString(),
    })
    await user.save()

    res.status(201).json({ routes: serializeRoutes(user) })
  } catch (err) {
    console.error('[routes/post]', err)
    res.status(500).json({ error: 'Could not save route.' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = req.user
    const before = user.routes.length
    user.routes = user.routes.filter((r) => r.id !== req.params.id)

    if (user.routes.length === before) {
      return res.status(404).json({ error: 'Route not found.' })
    }

    await user.save()
    res.json({ routes: serializeRoutes(user) })
  } catch (err) {
    console.error('[routes/delete]', err)
    res.status(500).json({ error: 'Could not remove route.' })
  }
})

export default router
