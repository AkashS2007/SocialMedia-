import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export function createRouter(db) {
  const router = Router();

  // POST /posts/:postId/like — like a post
  router.post('/posts/:postId/like', authMiddleware, (req, res) => {
    try {
      const postId = parseInt(req.params.postId);

      // Check if post exists
      const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found.' });
      }

      // INSERT OR IGNORE to handle duplicate likes gracefully
      db.prepare('INSERT OR IGNORE INTO likes (post_id, user_id) VALUES (?, ?)').run(postId, req.user.id);

      const likeCount = db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').get(postId).count;

      res.json({ like_count: likeCount });
    } catch (err) {
      console.error('Like error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // DELETE /posts/:postId/like — unlike a post
  router.delete('/posts/:postId/like', authMiddleware, (req, res) => {
    try {
      const postId = parseInt(req.params.postId);

      // Check if post exists
      const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found.' });
      }

      db.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').run(postId, req.user.id);

      const likeCount = db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').get(postId).count;

      res.json({ like_count: likeCount });
    } catch (err) {
      console.error('Unlike error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  return router;
}
