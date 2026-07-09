import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export function createRouter(db) {
  const router = Router();

  // GET /posts/:postId/comments — get all comments for a post
  router.get('/posts/:postId/comments', authMiddleware, (req, res) => {
    try {
      const postId = parseInt(req.params.postId);

      // Check if post exists
      const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found.' });
      }

      const comments = db.prepare(`
        SELECT
          c.*,
          u.username, u.display_name, u.avatar_url
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
      `).all(postId);

      res.json(comments);
    } catch (err) {
      console.error('Get comments error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // POST /posts/:postId/comments — create comment
  router.post('/posts/:postId/comments', authMiddleware, (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Comment content is required.' });
      }

      // Check if post exists
      const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found.' });
      }

      const result = db.prepare(
        'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)'
      ).run(postId, req.user.id, content.trim());

      const comment = db.prepare(`
        SELECT
          c.*,
          u.username, u.display_name, u.avatar_url
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `).get(result.lastInsertRowid);

      res.status(201).json(comment);
    } catch (err) {
      console.error('Create comment error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // DELETE /comments/:id — delete own comment
  router.delete('/comments/:id', authMiddleware, (req, res) => {
    try {
      const commentId = parseInt(req.params.id);

      const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found.' });
      }

      if (comment.user_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete your own comments.' });
      }

      db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
      res.json({ message: 'Comment deleted successfully.' });
    } catch (err) {
      console.error('Delete comment error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  return router;
}
