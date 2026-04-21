import React, { useState, useEffect, useRef, useCallback } from 'react';
import PostCard from '../components/Posts/PostCard';
import Loader from '../components/Layout/Loader';
import { getPostsFeed, getSuggestions, toggleFollow } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import styles from './FeedPage.module.css';

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const sentinelRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [postsRes, suggestionsRes] = await Promise.all([
          getPostsFeed(1),
          getSuggestions(),
        ]);
        setPosts(postsRes.data.posts);
        setHasMore(postsRes.data.hasMore);
        setSuggestions(suggestionsRes.data.suggestions?.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    try {
      const nextPage = page + 1;
      const { data } = await getPostsFeed(nextPage);
      setPosts(p => [...p, ...data.posts]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error(err);
    }
  }, [page, hasMore, loading]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore();
    }, { threshold: 0.1 });
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [loadMore]);

  const handleFollow = async (userId) => {
    setSuggestions(s => s.filter(u => u._id !== userId));
    try { await toggleFollow(userId); } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className={styles.loadingWrap}><Loader size="lg" /></div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.feedCol}>
        {/* Stories bar placeholder */}
        <div className={styles.storiesBar}>
          {[user, ...suggestions].filter(Boolean).map((u, i) => (
            <div key={u._id || i} className={styles.storyItem}>
              <div className="avatar-ring">
                <img src={u.profilePic} alt={u.username} className={`avatar ${styles.storyAvatar}`} />
              </div>
              <span className={styles.storyName}>{i === 0 ? 'Your story' : u.username}</span>
            </div>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className={styles.empty}>
            <h3>Your feed is empty</h3>
            <p>Follow people to see their posts here, or explore reels!</p>
            <Link to="/explore" className="btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>Explore</Link>
          </div>
        ) : (
          <>
            <div className={styles.posts}>
              {posts.map(post => <PostCard key={post._id} post={post} onDelete={(id) => setPosts(p => p.filter(x => x._id !== id))} />)}
            </div>
            <div ref={sentinelRef} style={{ height: 20 }} />
            {!hasMore && posts.length > 0 && (
              <p className={styles.endMsg}>You're all caught up! ✨</p>
            )}
          </>
        )}
      </div>

      {/* Right column - suggestions */}
      <aside className={styles.sidebar}>
        <div className={styles.profileWidget}>
          <Link to={`/${user?.username}`}>
            <div className="avatar-ring">
              <img src={user?.profilePic} alt="" className={`avatar ${styles.profileAvatar}`} />
            </div>
          </Link>
          <div>
            <Link to={`/${user?.username}`} className={styles.profileUsername}>{user?.username}</Link>
            <p className={styles.profileFullname}>{user?.fullName || 'Update your name'}</p>
          </div>
          <Link to="/edit-profile" className={styles.switchLink}>Switch</Link>
        </div>

        {suggestions.length > 0 && (
          <div className={styles.suggestions}>
            <div className={styles.suggestionsHeader}>
              <span>Suggested for you</span>
              <Link to="/explore">See All</Link>
            </div>
            {suggestions.map(u => (
              <div key={u._id} className={styles.suggestionRow}>
                <Link to={`/${u.username}`}>
                  <img src={u.profilePic} alt="" className={`avatar ${styles.suggAvatar}`} />
                </Link>
                <div className={styles.suggInfo}>
                  <Link to={`/${u.username}`} className={styles.suggUsername}>{u.username}</Link>
                  <span className={styles.suggMeta}>{u.followers?.length || 0} followers</span>
                </div>
                <button className={styles.followBtn} onClick={() => handleFollow(u._id)}>Follow</button>
              </div>
            ))}
          </div>
        )}

        <p className={styles.footer}>© 2025 JIOREELS · Made in India 🇮🇳</p>
      </aside>
    </div>
  );
}
