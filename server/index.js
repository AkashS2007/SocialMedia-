import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { initDB } from './db/schema.js';
import { createRouter as createAuthRouter } from './routes/auth.js';
import { createRouter as createUsersRouter } from './routes/users.js';
import { createRouter as createPostsRouter } from './routes/posts.js';
import { createRouter as createCommentsRouter } from './routes/comments.js';
import { createRouter as createLikesRouter } from './routes/likes.js';
import { createRouter as createFollowsRouter } from './routes/follows.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize database
const db = initDB();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Copy default avatar from client/assets to uploads if it doesn't exist
const defaultAvatarDest = path.join(uploadsDir, 'default-avatar.svg');
if (!fs.existsSync(defaultAvatarDest)) {
  const defaultAvatarSrc = path.join(__dirname, '..', 'client', 'assets', 'default-avatar.svg');
  if (fs.existsSync(defaultAvatarSrc)) {
    fs.copyFileSync(defaultAvatarSrc, defaultAvatarDest);
    console.log('Copied default-avatar.svg to uploads/');
  } else {
    // Create a simple default avatar SVG if source doesn't exist
    const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="50" fill="#e0e0e0"/>
  <circle cx="50" cy="38" r="16" fill="#bdbdbd"/>
  <ellipse cx="50" cy="78" rx="28" ry="20" fill="#bdbdbd"/>
</svg>`;
    fs.writeFileSync(defaultAvatarDest, defaultSvg);
    console.log('Created default-avatar.svg in uploads/');
  }
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, '..', 'client')));

// Mount routes
app.use('/api/auth', createAuthRouter(db));
app.use('/api/users', createUsersRouter(db));
app.use('/api/posts', createPostsRouter(db));
app.use('/api', createCommentsRouter(db));
app.use('/api', createLikesRouter(db));
app.use('/api', createFollowsRouter(db));

// Catch-all: serve client index.html for SPA routing
app.get('*', (req, res) => {
  const clientIndex = path.join(__dirname, '..', 'client', 'index.html');
  if (fs.existsSync(clientIndex)) {
    res.sendFile(clientIndex);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
