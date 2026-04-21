# 🚀 How to Run JIOREELS

## The "Cannot GET /" error — explained

This error happens when you open `http://localhost:5002` directly in the browser.
Port **5002** is the **backend API server** — it only handles `/api/*` routes.
The **frontend UI** runs separately on port **3000** via React dev server.

---

## ✅ Development Mode (Recommended)

Run **TWO terminals** at the same time:

### Terminal 1 — Backend API (port 5002)
```bash
cd jioreels/backend
npm install          # only needed first time
npm run dev          # starts nodemon on http://localhost:5002
```

You should see:
```
🚀 ─────────────────────────────────────────
   JIOREELS backend  →  http://localhost:5002
   API health check  →  http://localhost:5002/api/health
   MongoDB           →  mongodb://127.0.0.1:27017/jioreels
─────────────────────────────────────────────
```

### Terminal 2 — Frontend UI (port 3000)
```bash
cd jioreels/frontend
npm install          # only needed first time
npm start            # starts React dev server on http://localhost:3000
```

### ✅ Open in browser: `http://localhost:3000`

> **Never** open `http://localhost:5002` — that's the API, not the UI.

---

## ✅ One-Command Start (using root package.json)

From the **root** `jioreels/` folder:
```bash
npm install          # installs concurrently
npm run dev          # starts both backend + frontend together
```

Then open: `http://localhost:3000`

---

## ✅ Production Mode (single server on port 5002)

This builds the React app and lets the Express backend serve it:

```bash
# Step 1: Build the React frontend
cd jioreels/frontend
npm run build

# Step 2: Start backend in production mode
cd ../backend
NODE_ENV=production npm start
```

Then open: `http://localhost:5002`
(In production Express serves the React build, so `Cannot GET /` is fixed.)

---

## Port Reference

| Service       | Port | URL                              |
|---------------|------|----------------------------------|
| Frontend (dev)| 3000 | http://localhost:3000  ← open this |
| Backend API   | 5002 | http://localhost:5002/api/health |
| MongoDB       | 27017| mongodb://127.0.0.1:27017/jioreels |

---

## MongoDB Setup

### Option A — Local MongoDB
Make sure MongoDB is installed and running:
```bash
# macOS
brew services start mongodb-community

# Ubuntu/Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```
The `.env` already points to: `MONGO_URI=mongodb://127.0.0.1:27017/jioreels`

### Option B — MongoDB Atlas (Cloud, recommended for production)
1. Go to https://cloud.mongodb.com and create a free cluster
2. Get your connection string
3. Update `backend/.env`:
```
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/jioreels?retryWrites=true&w=majority
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot GET /` | Opened `:5002` instead of `:3000` | Open `http://localhost:3000` |
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB not running | Start MongoDB service |
| `Network Error` on login/register | Backend not running | Start backend first |
| `Proxy error` in frontend | Port mismatch | Frontend proxy = `:5002`, backend PORT = `5002` |
| Upload fails | Cloudinary keys missing | Check `.env` Cloudinary values |
