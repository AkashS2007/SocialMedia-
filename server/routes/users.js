import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

export function createRouter(db) {
  const router = Router();

  // GET /me — current user's profile
  router.get('/me', authMiddleware, (req, res) => {
    try {
      const user = db.prepare(`
        SELECT id, username, email, display_name, bio, avatar_url, created_at
        FROM users WHERE id = ?
      `).get(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const followerCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(user.id).count;
      const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(user.id).count;
      const postCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(user.id).count;

      res.json({
        ...user,
        follower_count: followerCount,
        following_count: followingCount,
        post_count: postCount
      });
    } catch (err) {
      console.error('Get me error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // GET /search?q= — search users
  router.get('/search', authMiddleware, (req, res) => {
    try {
      const { q } = req.query;
      if (!q || q.trim().length === 0) {
        return res.json([]);
      }

      const searchTerm = `%${q.trim()}%`;
      const users = db.prepare(`
        SELECT id, username, display_name, bio, avatar_url, created_at
        FROM users
        WHERE username LIKE ? OR display_name LIKE ?
        LIMIT 20
      `).all(searchTerm, searchTerm);

      res.json(users);
    } catch (err) {
      console.error('Search error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // GET /:id — get user profile by id
  router.get('/:id', authMiddleware, (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = db.prepare(`
        SELECT id, username, email, display_name, bio, avatar_url, created_at
        FROM users WHERE id = ?
      `).get(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const followerCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(userId).count;
      const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(userId).count;
      const postCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(userId).count;

      const isFollowing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, userId);

      res.json({
        ...user,
        follower_count: followerCount,
        following_count: followingCount,
        post_count: postCount,
        is_following: !!isFollowing
      });
    } catch (err) {
      console.error('Get user error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // PUT /me — update profile
  router.put('/me', authMiddleware, upload.single('avatar'), (req, res) => {
    try {
      const { display_name, bio } = req.body;
      const updates = [];
      const params = [];

      if (display_name !== undefined) {
        updates.push('display_name = ?');
        params.push(display_name);
      }

      if (bio !== undefined) {
        updates.push('bio = ?');
        params.push(bio);
      }

      if (req.file) {
        const avatarUrl = '/uploads/' + req.file.filename;
        updates.push('avatar_url = ?');
        params.push(avatarUrl);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update.' });
      }

      params.push(req.user.id);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

      const user = db.prepare(`
        SELECT id, username, email, display_name, bio, avatar_url, created_at
        FROM users WHERE id = ?
      `).get(req.user.id);

      res.json(user);
    } catch (err) {
      console.error('Update profile error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // GET /:id/posts — get user's posts
  router.get('/:id/posts', authMiddleware, (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      const posts = db.prepare(`
        SELECT
          p.*,
          u.username, u.display_name, u.avatar_url,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
          EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
      `).all(req.user.id, userId);

      // Convert is_liked from 0/1 to boolean
      const result = posts.map(post => ({ ...post, is_liked: !!post.is_liked }));

      res.json(result);
    } catch (err) {
      console.error('Get user posts error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  return router;
}
