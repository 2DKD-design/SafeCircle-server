import mongoose from 'mongoose'

const { Schema } = mongoose

const CommunityPostSchema = new Schema(
  {
    author: { type: String, required: true, trim: true },
    authorUser: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    verified: { type: Boolean, default: false },
    place: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    likes: { type: Number, default: 0 },
    // Who has already liked this post, so a user can't inflate the count by
    // clicking repeatedly. Stored as strings so anonymous/local-only likes
    // (pre-login) never collide with real user ids.
    likedBy: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString()
        ret.time = ret.createdAt ? ret.createdAt.getTime() : Date.now()
        delete ret._id
        delete ret.__v
        delete ret.authorUser
        delete ret.likedBy
        delete ret.createdAt
        delete ret.updatedAt
        return ret
      },
    },
  }
)

export default mongoose.model('CommunityPost', CommunityPostSchema)
