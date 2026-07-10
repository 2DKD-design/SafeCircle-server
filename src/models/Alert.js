import mongoose from 'mongoose'

const { Schema } = mongoose

const AlertSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '', trim: true },
    place: { type: String, required: true, trim: true },
    severity: { type: String, enum: ['critical', 'warning', 'info'], default: 'warning' },
    sourceUrl: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    reactions: { type: Number, default: 0 },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString()
        ret.time = ret.createdAt ? ret.createdAt.getTime() : Date.now()
        delete ret._id
        delete ret.__v
        delete ret.reportedBy
        delete ret.createdAt
        delete ret.updatedAt
        return ret
      },
    },
  }
)

export default mongoose.model('Alert', AlertSchema)
