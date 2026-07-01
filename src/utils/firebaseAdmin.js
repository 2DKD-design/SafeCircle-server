// Lazily-initialized Firebase Admin instance, used only to SEND push
// notifications (e.g. when an SOS is triggered). This is entirely
// optional: if FIREBASE_SERVICE_ACCOUNT_JSON isn't set, FCM tokens are
// still stored and everything else works, we just skip the actual send.

let messagingPromise = null

function getMessaging() {
  if (messagingPromise) return messagingPromise

  messagingPromise = (async () => {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    if (!raw) return null

    try {
      const admin = await import('firebase-admin')
      const serviceAccount = JSON.parse(raw)
      const app = admin.default.apps.length
        ? admin.default.app()
        : admin.default.initializeApp({ credential: admin.default.credential.cert(serviceAccount) })
      return admin.default.messaging(app)
    } catch (err) {
      console.warn('[fcm] Firebase Admin not configured/available, push notifications disabled:', err.message)
      return null
    }
  })()

  return messagingPromise
}

// Sends the same notification to a list of device tokens. Silently
// no-ops if Firebase Admin isn't configured. Returns how many sends
// succeeded (0 if push isn't set up).
export async function sendPushToTokens(tokens, { title, body, data = {} } = {}) {
  const messaging = await getMessaging()
  if (!messaging || !tokens?.length) return 0

  const results = await Promise.allSettled(
    tokens.map((token) =>
      messaging.send({
        token,
        notification: { title, body },
        data,
      })
    )
  )
  return results.filter((r) => r.status === 'fulfilled').length
}
