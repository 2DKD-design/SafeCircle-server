import mongoose from 'mongoose'

const { Schema } = mongoose

const SosEventSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lat: { type: Number },
    lng: { type: Number },
    accuracy: { type: Number },
    source: { type: String, default: 'manual' }, // e.g. 'manual', 'voice'
    contactsNotified: { type: Number, default: 0 },
    status: { type: String, default: 'sent' },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  }
)

export default mongoose.model('SosEvent', SosEventSchema)
