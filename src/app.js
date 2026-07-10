import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import authRoutes from './routes/auth.js'
import settingsRoutes from './routes/settings.js'
import contactsRoutes from './routes/contacts.js'
import sosRoutes from './routes/sos.js'
import fcmRoutes from './routes/fcm.js'

export function createApp() {
  const app = express()

  const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())

  app.use(cors({ origin: allowedOrigins }))
  app.use(express.json())
  app.use(morgan('dev'))

  app.get('/api/health', (_req, res) => res.json({ ok: true }))

  app.use('/api/auth', authRoutes)
  app.use('/api/settings', settingsRoutes)
  app.use('/api/contacts', contactsRoutes)
  app.use('/api/sos', sosRoutes)
  app.use('/api/fcm', fcmRoutes)

  // 404 for anything else under /api
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }))

  // Centralized error handler (catches anything thrown/passed to next())
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('[unhandled]', err)
    res.status(500).json({ error: 'Something went wrong on the server.' })
  })

  return app
}
