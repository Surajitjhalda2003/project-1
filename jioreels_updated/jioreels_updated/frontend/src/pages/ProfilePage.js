import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, getUserPosts, getUserReels, toggleFollow } from '../utils/api';
import Loader from '../components/Layout/Loader';
import { BsFillCameraReelsFill, BsGrid3X3 } from 'react-icons/bs';
import { AiFillHeart } from 'react-icons/ai';
import { BsFillPlayFill } from 'react-icons/bs';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [tab, setTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwn = currentUser?.username === username;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await getUserProfile(username);
        setProfile(data);
        setIsFollowing(data.user.followers?.some(f => f._id === currentUser?._id || f === currentUser?._id));

        const [postsRes, reelsRes] = await Promise.all([
          getUserPosts(username),
          getUserReels(username),
        ]);
        setPosts(postsRes.data.posts);
        setReels(reelsRes.data.reels);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [username, currentUser?._id]);

  const handleFollow = async () => {
    try {
      setIsFollowing(f => !f);
      setProfile(p => ({
        ...p,
        user: {
          ...p.user,
          followers: isFollowing
            ? p.user.followers.filter(f => f._id !== currentUser._id && f !== currentUser._id)
            : [...p.user.followers, currentUser._id],
        },
      }));
      await toggleFollow(profile.user._id);
    } catch (err) {
      setIsFollowing(f => !f);
    }
  };

  if (loading) return <div className={styles.loading}><Loader size="lg" /></div>;
  if (!profile) return <div className={styles.notFound}><h2>User not found</h2></div>;

  const { user: u, postCount, reelCount } = profile;
  const displayItems = tab === 'posts' ? posts : reels;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.avatarSection}>
          <div className="avatar-ring">
            <img src={u.profilePic} alt={u.username} className={`avatar ${styles.profilePic}`} />
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.usernameRow}>
            <h2 className={styles.username}>{u.username}</h2>
            {isOwn ? (
              <Link to="/edit-profile" className="btn-secondary" style={{ fontSize: 13, padding: '7px 16px' }}>
                Edit Profile
              </Link>
            ) : (
              <button
                onClick={handleFollow}
                className={isFollowing ? 'btn-secondary' : 'btn-primary'}
                style={{ fontSize: 13, padding: '7px 16px' }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>{postCount + reelCount}</span>
              <span className={styles.statLabel}>posts</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>{u.followers?.length || 0}</span>
              <span className={styles.statLabel}>followers</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>{u.following?.length || 0}</span>
              <span className={styles.statLabel}>following</span>
            </div>
          </div>

          <div className={styles.bio}>
            {u.fullName && <p className={styles.fullName}>{u.fullName}</p>}
            {u.bio && <p className={styles.bioText}>{u.bio}</p>}
            {u.website && <a href={u.website} target="_blank" rel="noreferrer" className={styles.website}>{u.website}</a>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'posts' ? styles.active : ''}`}
          onClick={() => setTab('posts')}
        >
          <BsGrid3X3 /> Posts
        </button>
        <button
          className={`${styles.tab} ${tab === 'reels' ? styles.active : ''}`}
          onClick={() => setTab('reels')}
        >
          <BsFillCameraReelsFill /> Reels
        </button>
      </div>

      {/* Grid */}
      {displayItems.length === 0 ? (
        <div className={styles.empty}>
          <p>No {tab} yet</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {displayItems.map(item => (
            <Link
              key={item._id}
              to={tab === 'posts' ? `/post/${item._id}` : '/reels'}
              className={styles.gridItem}
            >
              {tab === 'posts' ? (
                <img src={item.mediaUrl?.[0]} alt="" className={styles.gridMedia} />
              ) : (
                <video src={item.videoUrl} className={styles.gridMedia} muted preload="metadata" />
              )}
              <div className={styles.gridOverlay}>
                {tab === 'posts' ? <AiFillHeart /> : <BsFillPlayFill />}
                <span>{tab === 'posts' ? item.likes?.length : item.views}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
