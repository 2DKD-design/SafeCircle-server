import mongoose from 'mongoose'

const { Schema } = mongoose

const ContactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    relation: { type: String, default: '', trim: true },
    priority: { type: Boolean, default: false },
  },
  {
    // Give each contact an `id` (string) alongside Mongo's `_id`, and strip
    // internal fields, so the frontend's `contact.id` keeps working.
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString()
        delete ret._id
      },
    },
  }
)

const VoiceSettingsSchema = new Schema(
  {
    codeWord: { type: String, default: 'red phoenix' },
    active: { type: Boolean, default: true },
    continuous: { type: Boolean, default: false },
    autoSendOnDetect: { type: Boolean, default: false },
    picovoiceAccessKey: { type: String, default: '' },
    builtinKeyword: { type: String, default: '' },
    customKeywordBase64: { type: String, default: '' },
    sensitivity: { type: Number, default: 0.6 },
  },
  { _id: false }
)

const NotificationPrefsSchema = new Schema(
  {
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
  },
  { _id: false }
)

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: '' },
    homeArea: { type: String, default: '' },
    contacts: { type: [ContactSchema], default: [] },
    voiceSettings: { type: VoiceSettingsSchema, default: () => ({}) },
    notificationPrefs: { type: NotificationPrefsSchema, default: () => ({}) },
    fcmTokens: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        delete ret.passwordHash
        return ret
      },
    },
  }
)

export default mongoose.model('User', UserSchema)
