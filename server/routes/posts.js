import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for post image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'post-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

export function createRouter(db) {
  const router = Router();

  // POST / — create post
  router.post('/', authMiddleware, upload.single('image'), (req, res) => {
    try {
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Post content is required.' });
      }

      let imageUrl = null;
      if (req.file) {
        imageUrl = '/uploads/' + req.file.filename;
      }

      const result = db.prepare(
        'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)'
      ).run(req.user.id, content.trim(), imageUrl);

      const post = db.prepare(`
        SELECT
          p.*,
          u.username, u.display_name, u.avatar_url,
          0 as like_count,
          0 as comment_count,
          0 as is_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `).get(result.lastInsertRowid);

      post.is_liked = false;
      res.status(201).json(post);
    } catch (err) {
      console.error('Create post error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // GET /feed — posts from followed users + own
  router.get('/feed', authMiddleware, (req, res) => {
    try {
      const offset = parseInt(req.query.offset) || 0;
      const limit = 20;

      const posts = db.prepare(`
        SELECT
          p.*,
          u.username, u.display_name, u.avatar_url,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
          EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ? OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `).all(req.user.id, req.user.id, req.user.id, limit, offset);

      const result = posts.map(post => ({ ...post, is_liked: !!post.is_liked }));
      res.json(result);
    } catch (err) {
      console.error('Feed error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // GET /explore — all posts, newest first
  router.get('/explore', authMiddleware, (req, res) => {
    try {
      const offset = parseInt(req.query.offset) || 0;
      const limit = 20;

      const posts = db.prepare(`
        SELECT
          p.*,
          u.username, u.display_name, u.avatar_url,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
          EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `).all(req.user.id, limit, offset);

      const result = posts.map(post => ({ ...post, is_liked: !!post.is_liked }));
      res.json(result);
    } catch (err) {
      console.error('Explore error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // GET /:id — single post with comments
  router.get('/:id', authMiddleware, (req, res) => {
    try {
      const postId = parseInt(req.params.id);

      const post = db.prepare(`
        SELECT
          p.*,
          u.username, u.display_name, u.avatar_url,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
          EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `).get(req.user.id, postId);

      if (!post) {
        return res.status(404).json({ error: 'Post not found.' });
      }

      post.is_liked = !!post.is_liked;

      const comments = db.prepare(`
        SELECT
          c.*,
          u.username, u.display_name, u.avatar_url
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
      `).all(postId);

      res.json({ ...post, comments });
    } catch (err) {
      console.error('Get post error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // DELETE /:id — delete own post
  router.delete('/:id', authMiddleware, (req, res) => {
    try {
      const postId = parseInt(req.params.id);

      const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found.' });
      }

      if (post.user_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete your own posts.' });
      }

      db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
      res.json({ message: 'Post deleted successfully.' });
    } catch (err) {
      console.error('Delete post error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  return router;
}
