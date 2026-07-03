// Thin email helper for account emails (currently just password resets).
//
// If SMTP_HOST/SMTP_USER/SMTP_PASS are set in .env, real emails are sent via
// nodemailer. If they're not configured (e.g. local development), the email
// is instead logged to the server console so the flow still works end to
// end without requiring an email provider.
import nodemailer from 'nodemailer'

let cachedTransporter = null
let warnedNoConfig = false

function getTransporter() {
  if (cachedTransporter) return cachedTransporter
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  return cachedTransporter
}

export async function sendPasswordResetEmail(to, resetUrl) {
  const transporter = getTransporter()
  const from = process.env.SMTP_FROM || 'SafeCircle <no-reply@safecircle.app>'
  const subject = 'Reset your SafeCircle password'
  const text = `We received a request to reset your SafeCircle password.\n\n` +
    `Reset it here (valid for 1 hour): ${resetUrl}\n\n` +
    `If you didn't request this, you can safely ignore this email.`
  const html = `
    <p>We received a request to reset your SafeCircle password.</p>
    <p><a href="${resetUrl}">Click here to reset your password</a> (valid for 1 hour).</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  `

  if (!transporter) {
    if (!warnedNoConfig) {
      console.warn('[mailer] SMTP is not configured (see server/.env.example) — logging reset link instead of emailing it.')
      warnedNoConfig = true
    }
    console.log(`[mailer] Password reset link for ${to}: ${resetUrl}`)
    return { delivered: false }
  }

  await transporter.sendMail({ from, to, subject, text, html })
  return { delivered: true }
}
