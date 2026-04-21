# ▶️ JIOREELS — START HERE

## The Problem You're Seeing

You opened `http://localhost:5002` after running `node server.js` — that shows
**"Cannot GET /"** because the React frontend hasn't been built yet.

The backend only knows about the UI *after you build it once*.

---

## ✅ ONE-TIME SETUP (Run these steps in order)

### Step 1 — Build the React frontend
Open a terminal, go to the `frontend` folder and run:
```
cd frontend
npm install
npm run build
```
This creates a `frontend/build` folder. **Only needed once** (or after code changes).

### Step 2 — Start the backend
```
cd ../backend
npm install
node server.js
```

### Step 3 — Open the browser
```
http://localhost:5002
```
✅ You should see the JIOREELS login page.

---

## ⚡ Windows One-Click Start

Double-click **`START.bat`** in this folder. It does all 3 steps automatically.

---

## After the First Setup

Once built, you only need to run the backend:
```
cd backend
node server.js
```
Then open `http://localhost:5002`.

---

## Why Does This Work?

```
http://localhost:5002/          → React app (Login, Feed, Reels...)
http://localhost:5002/api/*     → Express backend API
http://localhost:5002/api/health → Health check
```

Express serves the React build as static files AND handles all `/api/*` routes.
Everything runs on **one port: 5002**.

---

## If You Want to Develop (Live Reload)

Run TWO terminals:

**Terminal 1 (backend):**
```
cd backend
node server.js
```

**Terminal 2 (frontend with live reload):**
```
cd frontend
npm start
```
Then open `http://localhost:3000` for the live-reload dev experience.
