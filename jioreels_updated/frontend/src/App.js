import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/globals.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Sidebar from './components/Layout/Sidebar';
import MobileNav from './components/Layout/MobileNav';
import Loader from './components/Layout/Loader';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const ReelsPage = lazy(() => import('./pages/ReelsPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const UploadReelPage = lazy(() => import('./pages/UploadReelPage'));
const UploadPostPage = lazy(() => import('./pages/UploadPostPage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader fullscreen />;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader fullscreen />;
  return user ? <Navigate to="/" replace /> : children;
};

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <>{children}</>;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <MobileNav />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Suspense fallback={<Loader fullscreen />}>
              <AppLayout>
                <Routes>
                  {/* Public */}
                  <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                  <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

                  {/* Protected */}
                  <Route path="/" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
                  <Route path="/reels" element={<ProtectedRoute><ReelsPage /></ProtectedRoute>} />
                  <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                  <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
                  <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                  <Route path="/chat/:userId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                  <Route path="/upload/reel" element={<ProtectedRoute><UploadReelPage /></ProtectedRoute>} />
                  <Route path="/upload/post" element={<ProtectedRoute><UploadPostPage /></ProtectedRoute>} />
                  <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
                  <Route path="/post/:id" element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />
                  <Route path="/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                </Routes>
              </AppLayout>
            </Suspense>
            <ToastContainer
              position="bottom-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              theme="dark"
            />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
