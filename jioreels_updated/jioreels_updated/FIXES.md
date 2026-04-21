# 🔧 JIOREELS — Bug Fixes Applied

## Problems Found & Fixed

---

### 🗄️ 1. Database Connection (MongoDB)
**File:** `backend/config/db.js`

**Problem:** `useNewUrlParser` and `useUnifiedTopology` options throw warnings/errors in Mongoose 7+. Also, using `localhost` for MongoDB can resolve to IPv6 `::1` instead of `127.0.0.1`, causing connection refused errors.

**Fix:**
- Removed deprecated options from `mongoose.connect()`
- Changed `.env` MongoDB URI from `localhost` → `127.0.0.1`

```js
// ❌ Before (Mongoose 7 deprecated options)
await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// ✅ After
await mongoose.connect(uri);
```

> **For MongoDB Atlas:** Replace `MONGO_URI` in `.env` with:
> `mongodb+srv://<user>:<pass>@cluster0.mongodb.net/jioreels?retryWrites=true&w=majority`

---

### ☁️ 2. Cloudinary Video Upload Failing
**File:** `backend/config/cloudinary.js`

**Problem:** In `multer-storage-cloudinary` v4, the `params` field **must be an async function**, not a plain object. When it's a plain object, `resource_type: 'video'` is ignored and Cloudinary rejects video uploads as invalid files.

**Fix:**
```js
// ❌ Before (plain object — resource_type ignored for video)
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    resource_type: 'video',   // ← IGNORED as plain object
    folder: 'jioreels/reels',
  },
});

// ✅ After (async function — resource_type correctly sent)
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    resource_type: 'video',   // ← NOW WORKS
    folder: 'jioreels/reels',
    allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
  }),
});
```

---

### 📤 3. Profile Photo Upload Error
**File:** `frontend/src/utils/api.js` + `frontend/src/pages/EditProfilePage.js`

**Problem:** When manually setting `Content-Type: multipart/form-data`, the multipart **boundary** string is missing. Axios must set this header automatically when it detects a `FormData` object — if you force-set it, the server can't parse the upload.

**Fix in `api.js`:**
```js
// ✅ Delete Content-Type for FormData — let axios set it with boundary
API.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});
```

**Fix in `EditProfilePage.js`:**
```js
// ✅ Explicit FormData fields (not Object.entries spread)
const formData = new FormData();
formData.append('fullName',   form.fullName);
formData.append('username',   form.username);
formData.append('bio',        form.bio);
formData.append('website',    form.website);
if (avatarFile) formData.append('profilePic', avatarFile); // must match multer .single('profilePic')
```

---

### 🎬 4. Video Upload Failing (Reel)
**File:** `frontend/src/pages/UploadReelPage.js`

**Problem:** The FormData field name must exactly match what `multer` expects in the route (`uploadVideo.single('video')`). Also added MIME type validation before attempting upload.

**Fix:**
```js
// ✅ Field name MUST match uploadVideo.single('video')
formData.append('video', videoFile);   // was correct, but now also validates MIME type first
```

---

### 🛣️ 5. Route Ordering Conflict
**File:** `backend/routes/users.js`

**Problem:** Express matches routes in order. The wildcard `/:username` was catching `/suggestions` and `/edit-profile` before those specific routes were registered, returning 404 or treating them as usernames.

**Fix:**
```js
// ✅ Specific routes FIRST, wildcard routes LAST
router.get('/suggestions', protect, getSuggestions);         // ← first
router.put('/edit-profile', protect, uploadImage.single('profilePic'), editProfile);
router.post('/save/post/:postId', protect, toggleSavePost);
router.post('/follow/:id', protect, toggleFollow);

router.get('/:username', protect, getProfile);               // ← last (wildcard)
router.get('/:username/posts', protect, getUserPosts);
router.get('/:username/reels', protect, getUserReels);
```

---

### 🔢 6. ObjectId Comparison Bugs
**Files:** `userController.js`, `reelController.js`, `postController.js`

**Problem:** MongoDB ObjectIds are objects, not strings. Using `array.includes(objectId)` compares by reference (always false). Must use `.toString()` comparison.

**Fix:**
```js
// ❌ Before — reference comparison, always false
const isLiked = reel.likes.includes(req.user._id);

// ✅ After — string comparison
const isLiked = reel.likes.some(id => id.toString() === req.user._id.toString());
```

---

## Quick Start After Fixes

```bash
# 1. Backend
cd backend
npm install
npm run dev    # starts on port 5002

# 2. Frontend (separate terminal)
cd frontend
npm install
npm start      # starts on port 3000
```

Make sure your `.env` has correct values for:
- `MONGO_URI` — MongoDB Atlas URI or local `mongodb://127.0.0.1:27017/jioreels`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
