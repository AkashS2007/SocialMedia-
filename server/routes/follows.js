import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export function createRouter(db) {
  const router = Router();

  // POST /users/:id/follow — follow a user
  router.post('/users/:id/follow', authMiddleware, (req, res) => {
    try {
      const followingId = parseInt(req.params.id);

      // Prevent self-follow
      if (followingId === req.user.id) {
        return res.status(400).json({ error: 'You cannot follow yourself.' });
      }

      // Check if user exists
      const user = db.prepare('SELECT id FROM users WHERE id = ?').get(followingId);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // INSERT OR IGNORE to handle duplicate follows
      db.prepare('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.user.id, followingId);

      res.json({ message: 'Successfully followed user.' });
    } catch (err) {
      console.error('Follow error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // DELETE /users/:id/follow — unfollow a user
  router.delete('/users/:id/follow', authMiddleware, (req, res) => {
    try {
      const followingId = parseInt(req.params.id);

      db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(req.user.id, followingId);

      res.json({ message: 'Successfully unfollowed user.' });
    } catch (err) {
      console.error('Unfollow error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // GET /users/:id/followers — list followers
  router.get('/users/:id/followers', authMiddleware, (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      const followers = db.prepare(`
        SELECT
          u.id, u.username, u.display_name, u.bio, u.avatar_url,
          EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following
        FROM follows f
        JOIN users u ON f.follower_id = u.id
        WHERE f.following_id = ?
        ORDER BY f.created_at DESC
      `).all(req.user.id, userId);

      const result = followers.map(f => ({ ...f, is_following: !!f.is_following }));
      res.json(result);
    } catch (err) {
      console.error('Get followers error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // GET /users/:id/following — list following
  router.get('/users/:id/following', authMiddleware, (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      const following = db.prepare(`
        SELECT
          u.id, u.username, u.display_name, u.bio, u.avatar_url,
          EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following
        FROM follows f
        JOIN users u ON f.following_id = u.id
        WHERE f.follower_id = ?
        ORDER BY f.created_at DESC
      `).all(req.user.id, userId);

      const result = following.map(f => ({ ...f, is_following: !!f.is_following }));
      res.json(result);
    } catch (err) {
      console.error('Get following error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  return router;
}
