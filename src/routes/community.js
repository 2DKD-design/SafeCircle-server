import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import CommunityPost from '../models/CommunityPost.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const posts = await CommunityPost.find().sort({ createdAt: -1 }).limit(200)
    res.json({ community: posts.map((p) => p.toJSON()) })
  } catch (err) {
    console.error('[community/get]', err)
    res.status(500).json({ error: 'Could not load community posts.' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const { place, text, tags } = req.body || {}
    if (!place || !text) {
      return res.status(400).json({ error: 'place and text are required.' })
    }

    const post = await CommunityPost.create({
      author: req.user.name,
      authorUser: req.user._id,
      verified: false,
      place,
      text,
      tags: Array.isArray(tags) ? tags : [],
    })

    res.status(201).json({ post: post.toJSON() })
  } catch (err) {
    console.error('[community/post]', err)
    res.status(500).json({ error: 'Could not create post.' })
  }
})

router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post not found.' })

    const uid = req.user.id
    if (!post.likedBy.includes(uid)) {
      post.likedBy.push(uid)
      post.likes += 1
      await post.save()
    }

    res.json({ post: post.toJSON() })
  } catch (err) {
    console.error('[community/like]', err)
    res.status(500).json({ error: 'Could not like post.' })
  }
})

export default router
