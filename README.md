# 🎬 JIOREELS — Full Stack Social Media Platform

> India's own Instagram-like Reels platform. Built with MERN stack + Cloudinary + Socket.io.

---

## 📁 Complete File Structure

```
jioreels/
│
├── 📂 backend/
│   ├── server.js                      # Express app + Socket.io entry point
│   ├── package.json
│   ├── .env.example                   # Environment variable template
│   │
│   ├── 📂 config/
│   │   ├── db.js                      # MongoDB Atlas connection
│   │   └── cloudinary.js              # Cloudinary + Multer setup (images & videos)
│   │
│   ├── 📂 models/                     # Mongoose schemas
│   │   ├── User.js                    # User schema (followers, following, bcrypt)
│   │   ├── Reel.js                    # Reel schema (video, likes, comments, score)
│   │   ├── Post.js                    # Post schema (carousel, likes, comments)
│   │   ├── Notification.js            # Notification schema
│   │   └── Conversation.js            # Chat + messages schema
│   │
│   ├── 📂 controllers/                # Business logic (MVC)
│   │   ├── authController.js          # Register, login, getMe
│   │   ├── userController.js          # Profile, follow/unfollow, edit, suggestions
│   │   ├── reelController.js          # Upload, feed, explore, like, comment, trending
│   │   ├── postController.js          # Create, feed, like, comment, delete
│   │   ├── notificationController.js  # Get notifications, mark read
│   │   ├── searchController.js        # Search users & hashtags
│   │   └── chatController.js          # Conversations, send messages
│   │
│   ├── 📂 routes/                     # Express route definitions
│   │   ├── auth.js                    # POST /register, /login · GET /me
│   │   ├── users.js                   # GET/PUT profile, follow, suggestions
│   │   ├── reels.js                   # CRUD reels, feed, explore, trending
│   │   ├── posts.js                   # CRUD posts, feed
│   │   ├── notifications.js           # GET notifications, PUT read-all
│   │   ├── search.js                  # GET /search?q=...
│   │   └── chat.js                    # Conversations & messaging
│   │
│   ├── 📂 middleware/
│   │   └── auth.js                    # JWT protect + optionalAuth middleware
│   │
│   └── 📂 utils/
│       └── socketHandler.js           # Socket.io events (online users, typing, chat)
│
│
└── 📂 frontend/
    ├── package.json
    ├── .env.example
    │
    ├── 📂 public/
    │   └── index.html                 # HTML shell with SEO meta tags
    │
    └── 📂 src/
        ├── index.js                   # React DOM entry point
        ├── App.js                     # Router + lazy loading + layout
        │
        ├── 📂 styles/
        │   └── globals.css            # CSS variables, dark/light theme, utilities
        │
        ├── 📂 context/
        │   ├── AuthContext.js         # User state, login/register/logout
        │   ├── SocketContext.js       # Socket.io connection + online users
        │   └── ThemeContext.js        # Dark/light mode toggle + localStorage
        │
        ├── 📂 utils/
        │   └── api.js                 # Axios instance + all API call functions
        │
        ├── 📂 components/
        │   │
        │   ├── 📂 Layout/
        │   │   ├── Sidebar.js         # Desktop navigation sidebar
        │   │   ├── Sidebar.module.css
        │   │   ├── MobileNav.js       # Bottom nav bar for mobile
        │   │   ├── MobileNav.module.css
        │   │   ├── Loader.js          # Fullscreen loader + spinner
        │   │   └── Loader.module.css
        │   │
        │   ├── 📂 Reels/
        │   │   ├── ReelCard.js        # Single reel player (autoplay, like, comment, share)
        │   │   ├── ReelCard.module.css
        │   │   ├── ReelsFeed.js       # Vertical snap-scroll feed + infinite scroll
        │   │   └── ReelsFeed.module.css
        │   │
        │   └── 📂 Posts/
        │       ├── PostCard.js        # Instagram-style post card (carousel, like, comment)
        │       └── PostCard.module.css
        │
        └── 📂 pages/
            ├── LoginPage.js           # Login form
            ├── RegisterPage.js        # Registration form
            ├── Auth.module.css        # Shared auth page styles
            │
            ├── FeedPage.js            # Home feed (posts + suggestions sidebar)
            ├── FeedPage.module.css
            │
            ├── ReelsPage.js           # Full-screen reels (Following / For You tabs)
            ├── ReelsPage.module.css
            │
            ├── ExplorePage.js         # Grid explore (trending reels)
            ├── ExplorePage.module.css
            │
            ├── ProfilePage.js         # User profile (posts/reels grid, follow)
            ├── ProfilePage.module.css
            │
            ├── SearchPage.js          # Search users + hashtags with debounce
            ├── SearchPage.module.css
            │
            ├── NotificationsPage.js   # Real-time notifications feed
            ├── NotificationsPage.module.css
            │
            ├── ChatPage.js            # Real-time DM chat with Socket.io
            ├── ChatPage.module.css
            │
            ├── UploadReelPage.js      # Drag & drop reel upload
            ├── UploadPostPage.js      # Multi-image post upload
            ├── UploadPage.module.css  # Shared upload styles
            │
            ├── EditProfilePage.js     # Avatar + bio + links edit
            ├── EditProfilePage.module.css
            │
            ├── PostDetailPage.js      # Single post detail view
            └── PostDetailPage.module.css
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Backend
cd jioreels/backend
npm install

# Frontend
cd jioreels/frontend
npm install
```

### 2. Configure Environment Variables

**Backend** — copy `.env.example` to `.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/jioreels
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**Frontend** — copy `.env.example` to `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm start
```

App runs at → **http://localhost:3000**

---

## ☁️ Deployment

| Service       | Platform          |
|---------------|-------------------|
| Frontend      | Vercel / Netlify  |
| Backend       | Render / Railway  |
| Database      | MongoDB Atlas     |
| Media Storage | Cloudinary        |

### Deploy Frontend (Vercel)
```bash
cd frontend
npx vercel --prod
```
Set env vars: `REACT_APP_API_URL`, `REACT_APP_SOCKET_URL`

### Deploy Backend (Render)
- Connect GitHub repo → select `backend/` as root
- Add all `.env` variables in Render dashboard
- Start command: `npm start`

---

## 🗄️ MongoDB Schemas

| Schema       | Key Fields |
|--------------|-----------|
| User         | username, email, password (bcrypt), profilePic, bio, followers[], following[] |
| Reel         | userId, videoUrl, caption, hashtags[], likes[], comments[], views, interactionScore |
| Post         | userId, mediaUrl[], caption, hashtags[], likes[], comments[] |
| Notification | recipient, sender, type, post/reel ref, isRead |
| Conversation | participants[], messages[], lastMessage |

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Reels
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reels` | Upload reel (multipart) |
| GET | `/api/reels/feed` | Following feed (paginated) |
| GET | `/api/reels/explore` | Explore/trending (paginated) |
| GET | `/api/reels/trending` | Top 20 by score |
| GET | `/api/reels/:id` | Get single reel + increment view |
| POST | `/api/reels/:id/like` | Toggle like |
| POST | `/api/reels/:id/comment` | Add comment |
| DELETE | `/api/reels/:id` | Delete own reel |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create post (multipart, up to 10 images) |
| GET | `/api/posts/feed` | Following feed (paginated) |
| GET | `/api/posts/:id` | Get single post |
| POST | `/api/posts/:id/like` | Toggle like |
| POST | `/api/posts/:id/comment` | Add comment |
| DELETE | `/api/posts/:id` | Delete own post |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:username` | Get profile |
| PUT | `/api/users/edit-profile` | Update profile + avatar |
| POST | `/api/users/follow/:id` | Follow / unfollow |
| GET | `/api/users/suggestions` | Suggested users |
| GET | `/api/users/:username/posts` | User's posts |
| GET | `/api/users/:username/reels` | User's reels |

---

## ⚡ Key Features

- **Snap-scroll Reels** — Full-screen vertical scroll with `scroll-snap-type: y mandatory`
- **Autoplay** — IntersectionObserver detects active reel and plays/pauses automatically
- **Infinite Scroll** — Sentinel-based for both reels and post feed
- **Real-time** — Socket.io for notifications, chat messages, and online presence
- **Recommendation** — `interactionScore` = likes×3 + comments×2 + views×0.1 + shares×4
- **Dark/Light Mode** — CSS variables + `data-theme` attribute
- **JWT Auth** — Tokens stored in localStorage, auto-attached via Axios interceptors
- **Cloudinary** — Separate upload configs for images (1080px max) and videos (100MB max)
- **MVC Architecture** — Clean separation: models → controllers → routes

---

## 🇮🇳 Made with ❤️ in India — JIOREELS © 2025
#   j i o r e e l s 2 . 0  
 