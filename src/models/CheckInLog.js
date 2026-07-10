import mongoose from 'mongoose'

const { Schema } = mongoose

const CheckInLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startedAt: { type: Number, required: true },
    endedAt: { type: Number, required: true },
    status: { type: String, enum: ['safe', 'sos', 'expired'], required: true },
    note: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        delete ret.user
        delete ret.createdAt
        delete ret.updatedAt
        return ret
      },
    },
  }
)

export default mongoose.model('CheckInLog', CheckInLogSchema)
