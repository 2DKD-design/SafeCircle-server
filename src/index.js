import 'dotenv/config'
import { createApp } from './app.js'
import { connectDB } from './db.js'

const PORT = process.env.PORT || 5000

async function main() {
  await connectDB()
  const app = createApp()
  app.listen(PORT, () => {
    console.log(`[server] SafeCircle API listening on http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error('[server] failed to start:', err.message)
  process.exit(1)
})
