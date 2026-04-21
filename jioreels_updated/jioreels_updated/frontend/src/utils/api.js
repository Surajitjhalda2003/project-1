import axios from 'axios';

// Always use relative /api path.
// - In production (built): Express on :5002 serves both React + API, so /api works perfectly.
// - In dev (npm start on :3000): CRA proxy in package.json forwards /api → :5002.
const API = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('jio_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Never manually set Content-Type for FormData — axios sets it with the
  // required multipart boundary automatically.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
}, (err) => Promise.reject(err));

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jio_token');
      localStorage.removeItem('jio_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser    = (data) => API.post('/auth/login', data);
export const getMe        = ()     => API.get('/auth/me');

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUserProfile = (username)           => API.get(`/users/${username}`);
export const editProfile    = (data)               => API.put('/users/edit-profile', data);
export const toggleFollow   = (userId)             => API.post(`/users/follow/${userId}`);
export const getSuggestions = ()                   => API.get('/users/suggestions');
export const getUserPosts   = (username, page = 1) => API.get(`/users/${username}/posts?page=${page}`);
export const getUserReels   = (username, page = 1) => API.get(`/users/${username}/reels?page=${page}`);
export const toggleSavePost = (postId)             => API.post(`/users/save/post/${postId}`);

// ─── Reels ────────────────────────────────────────────────────────────────────
export const uploadReel       = (data)         => API.post('/reels', data);
export const getReelsFeed     = (page = 1)     => API.get(`/reels/feed?page=${page}`);
export const getExploreReels  = (page = 1)     => API.get(`/reels/explore?page=${page}`);
export const getTrendingReels = ()             => API.get('/reels/trending');
export const getReel          = (id)           => API.get(`/reels/${id}`);
export const toggleReelLike   = (id)           => API.post(`/reels/${id}/like`);
export const addReelComment   = (id, text)     => API.post(`/reels/${id}/comment`, { text });
export const deleteReel       = (id)           => API.delete(`/reels/${id}`);

// ─── Posts ────────────────────────────────────────────────────────────────────
export const createPost     = (data)       => API.post('/posts', data);
export const getPostsFeed   = (page = 1)   => API.get(`/posts/feed?page=${page}`);
export const getPost        = (id)         => API.get(`/posts/${id}`);
export const togglePostLike = (id)         => API.post(`/posts/${id}/like`);
export const addPostComment = (id, text)   => API.post(`/posts/${id}/comment`, { text });
export const deletePost     = (id)         => API.delete(`/posts/${id}`);

// ─── Notifications ────────────────────────────────────────────────────────────
export const getNotifications      = () => API.get('/notifications');
export const markNotificationsRead = () => API.put('/notifications/read-all');

// ─── Search ───────────────────────────────────────────────────────────────────
export const searchAll = (q, type = 'all') =>
  API.get(`/search?q=${encodeURIComponent(q)}&type=${type}`);

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const getConversations = ()             => API.get('/chat/conversations');
export const getConversation  = (userId)       => API.get(`/chat/${userId}`);
export const sendMessage      = (convId, data) => API.post(`/chat/${convId}/message`, data);

export default API;
