# 🎵 Vibe — Mini Social Media Platform

A full-stack social media application with a premium dark-themed glassmorphism UI, built with Express.js and vanilla JavaScript.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-FB015B?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | JWT-based signup & login with bcrypt password hashing |
| 👤 **User Profiles** | Customizable display name, bio, and avatar upload |
| 📝 **Posts** | Create text + image posts, delete your own posts |
| 💬 **Comments** | Add and delete comments on any post |
| ❤️ **Likes** | Like/unlike posts with animated heart feedback |
| 👥 **Follow System** | Follow/unfollow users with follower & following counts |
| 📰 **Personalized Feed** | See posts from people you follow |
| 🔍 **Explore & Search** | Discover new users and trending posts |
| 📱 **Responsive Design** | Works on desktop, tablet, and mobile |

---

## 🎨 Design

- **Dark glassmorphism theme** — translucent cards with `backdrop-filter: blur(20px)`
- **Purple / Teal / Pink gradient accents**
- **Animated auth page** with floating geometric shapes
- **Heart bounce animation** on like
- **Smooth fade-in & slide-up** page transitions
- **Custom glass-styled scrollbar**
- **Google Font Inter** typography

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite (via better-sqlite3) |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs |
| **File Uploads** | Multer |

---

## 📁 Project Structure

```
SocialMedia/
├── server/                        # Express.js backend
│   ├── index.js                   # App entry point (port 3000)
│   ├── package.json               # Dependencies & scripts
│   ├── db/
│   │   └── schema.js              # SQLite schema (5 tables)
│   ├── middleware/
│   │   └── auth.js                # JWT verification middleware
│   └── routes/
│       ├── auth.js                # Register & Login
│       ├── users.js               # Profiles, search, avatar upload
│       ├── posts.js               # CRUD, feed, explore
│       ├── comments.js            # Post comments
│       ├── likes.js               # Like / unlike
│       └── follows.js             # Follow / unfollow
│
├── client/                        # Static frontend
│   ├── index.html                 # Auth page (login / register)
│   ├── feed.html                  # Main feed
│   ├── profile.html               # User profile
│   ├── explore.html               # Discover users & posts
│   ├── css/
│   │   └── style.css              # 900+ line design system
│   ├── js/
│   │   ├── api.js                 # API client with JWT
│   │   ├── components.js          # Reusable UI components
│   │   ├── auth.js                # Auth page logic
│   │   ├── feed.js                # Feed page logic
│   │   ├── profile.js             # Profile page logic
│   │   └── explore.js             # Explore page logic
│   └── assets/
│       └── default-avatar.svg     # Default avatar
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AkashS2007/SocialMedia-.git
   cd SocialMedia-
   ```

2. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Start the server**
   ```bash
   npm run dev    # with auto-restart (nodemon)
   # or
   npm start      # without auto-restart
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/me` | Get current user profile |
| GET | `/api/users/:id` | Get a user's profile |
| PUT | `/api/users/me` | Update profile |
| GET | `/api/users/search?q=` | Search users |
| GET | `/api/users/:id/posts` | Get user's posts |

### Posts
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/posts` | Create a post |
| GET | `/api/posts/feed` | Get personalized feed |
| GET | `/api/posts/explore` | Get all posts (trending) |
| GET | `/api/posts/:id` | Get single post |
| DELETE | `/api/posts/:id` | Delete own post |

### Comments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/posts/:postId/comments` | Get comments |
| POST | `/api/posts/:postId/comments` | Add comment |
| DELETE | `/api/comments/:id` | Delete own comment |

### Likes
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/posts/:postId/like` | Like a post |
| DELETE | `/api/posts/:postId/like` | Unlike a post |

### Follows
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/:id/follow` | Follow a user |
| DELETE | `/api/users/:id/follow` | Unfollow a user |
| GET | `/api/users/:id/followers` | List followers |
| GET | `/api/users/:id/following` | List following |

---

## 🗄️ Database Schema

The app uses **SQLite** with 5 tables:

- **users** — id, username, email, password_hash, display_name, bio, avatar_url
- **posts** — id, user_id, content, image_url, created_at
- **comments** — id, post_id, user_id, content, created_at
- **likes** — id, post_id, user_id (unique constraint)
- **follows** — id, follower_id, following_id (unique constraint)

---

## 🧪 Quick Test

After starting the server, you can test the API:

```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","email":"demo@test.com","password":"demo123","display_name":"Demo User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","password":"demo123"}'
```

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ using Express.js & Vanilla JavaScript
</p>
