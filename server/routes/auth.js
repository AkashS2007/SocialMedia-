import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth.js';

export function createRouter(db) {
  const router = Router();

  // POST /register
  router.post('/register', (req, res) => {
    try {
      const { username, email, password, display_name } = req.body;

      // Validate username: 3+ chars, alphanumeric
      if (!username || username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: 'Username must be at least 3 characters and contain only letters, numbers, and underscores.' });
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }

      // Validate password: 6+ chars
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }

      // Check if username or email already exists
      const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
      if (existingUser) {
        return res.status(409).json({ error: 'Username or email already exists.' });
      }

      // Hash password
      const password_hash = bcrypt.hashSync(password, 10);
      const displayName = display_name || username;

      // Insert user
      const result = db.prepare(
        'INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)'
      ).run(username, email, password_hash, displayName);

      const user = db.prepare('SELECT id, username, email, display_name, bio, avatar_url, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

      // Generate JWT
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({ token, user });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // POST /login
  router.post('/login', (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const validPassword = bcrypt.compareSync(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Generate JWT
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

      // Return user without password_hash
      const { password_hash, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  return router;
}
