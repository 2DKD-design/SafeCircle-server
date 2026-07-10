# SafeCircle server

Express + MongoDB API for the SafeCircle frontend. Rebuilt to match the
contract already baked into the frontend's `src/api/client.js`.

## Setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGODB_URI` — a local MongoDB (`mongodb://127.0.0.1:27017/safecircle`) or an Atlas connection string.
- `JWT_SECRET` — any long random string (the `.env.example` comment shows a one-liner to generate one).
- `CLIENT_ORIGIN` — where your frontend runs, default `http://localhost:5173`.
- `FIREBASE_SERVICE_ACCOUNT_JSON` — optional, only needed if you want the server to actually *send* push notifications on SOS trigger. Without it, FCM tokens are still stored, just not used.

Then run it:

```bash
npm run dev     # restarts on file changes
# or
npm start
```

You should see:
```
[db] connected to MongoDB (safecircle)
[server] SafeCircle API listening on http://localhost:5000
```

## Frontend wiring

In the project root, copy `.env.example` to `.env` — `VITE_API_URL` already
defaults to `http://localhost:5000/api`, matching this server, so you
usually don't need to change it.

## Endpoints

| Method | Path                | Auth | Body                                   |
|--------|---------------------|------|-----------------------------------------|
| POST   | /api/auth/signup    | no   | `{ name, email, password }`             |
| POST   | /api/auth/login     | no   | `{ email, password }`                   |
| GET    | /api/auth/me        | yes  | —                                        |
| GET    | /api/settings       | yes  | —                                        |
| PUT    | /api/settings       | yes  | any of `{ name, phone, homeArea, voiceSettings, notificationPrefs }` |
| GET    | /api/contacts       | yes  | —                                        |
| POST   | /api/contacts       | yes  | `{ name, phone, relation, priority }`   |
| DELETE | /api/contacts/:id   | yes  | —                                        |
| POST   | /api/sos/trigger    | yes  | `{ lat, lng, accuracy, source }`        |
| GET    | /api/sos/history    | yes  | —                                        |
| POST   | /api/fcm/register   | yes  | `{ token }`                              |
| POST   | /api/fcm/unregister | yes  | `{ token }`                              |
| GET    | /api/alerts             | yes  | —                                      |
| POST   | /api/alerts             | yes  | `{ title, body, place, severity, sourceUrl }` |
| POST   | /api/alerts/:id/dismiss | yes  | — (hides it from *this* user only)     |
| GET    | /api/community           | yes  | —                                     |
| POST   | /api/community           | yes  | `{ place, text, tags }`               |
| POST   | /api/community/:id/like  | yes  | —                                     |
| GET    | /api/routes         | yes  | —                                        |
| POST   | /api/routes         | yes  | `{ name, from, to, fromPoint, toPoint, travelMode, rating }` |
| DELETE | /api/routes/:id     | yes  | —                                        |
| GET    | /api/checkins        | yes  | — (returns `{ activeCheckIn, checkInLog }`) |
| POST   | /api/checkins/start  | yes  | `{ minutes, note }`                      |
| POST   | /api/checkins/end    | yes  | `{ status }` (`safe` \| `sos` \| `expired`) |

Authenticated requests need `Authorization: Bearer <token>` (the token
returned by signup/login).

## Notes / things you may want to extend

- **SOS notifications**: `/sos/trigger` records the event and (if configured) sends a confirmation push to the *reporting user's own* devices. It doesn't yet text/call/push the emergency contacts themselves — that needs a provider like Twilio (SMS) plus each contact having a way to receive it. Wire that up in `src/routes/sos.js`.
- **Passwords**: hashed with bcrypt, never returned in API responses.
- **Data model**: one `User` document holds profile, contacts, saved routes, voice settings, notification prefs, and the current active check-in (if any). `SosEvent` and `CheckInLog` are separate collections for history. `Alert` and `CommunityPost` are shared collections — every signed-in user sees the same feed. Dismissing an alert doesn't delete it; it just adds the alert's id to that user's `dismissedAlertIds`, so it drops out of *their* feed only.
