import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toggleReelLike, addReelComment } from '../../utils/api';
import { toast } from 'react-toastify';
import { format } from 'timeago.js';
import {
  AiFillHeart, AiOutlineHeart, AiOutlineComment,
  AiOutlineShareAlt, AiOutlineMore, AiFillPlayCircle,
} from 'react-icons/ai';
import { BsMusicNote, BsVolumeUp, BsVolumeMute } from 'react-icons/bs';
import styles from './ReelCard.module.css';

export default function ReelCard({ reel, isActive }) {
  const { user }    = useAuth();
  const videoRef    = useRef(null);
  const isExternal  = reel.isExternal === true;   // Pexels / external reel

  const [isLiked,      setIsLiked]      = useState(!isExternal && reel.likes?.includes(user?._id));
  const [likesCount,   setLikesCount]   = useState(reel.likes?.length || 0);
  const [comments,     setComments]     = useState(reel.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText,  setCommentText]  = useState('');
  const [isMuted,      setIsMuted]      = useState(false);
  const [isPaused,     setIsPaused]     = useState(false);

  // Play/pause based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); setIsPaused(false); }
    else              { video.pause(); setIsPaused(true); }
  };

  const handleLike = async () => {
    // External (Pexels) reels can't be liked via API
    if (isExternal) {
      toast.info('Like this reel on Pexels!');
      return;
    }
    const prevLiked = isLiked;
    setIsLiked(!prevLiked);
    setLikesCount(c => prevLiked ? c - 1 : c + 1);
    try {
      await toggleReelLike(reel._id);
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(c => prevLiked ? c + 1 : c - 1);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    // External reels — redirect to Pexels instead
    if (isExternal) {
      window.open(reel.externalUrl, '_blank');
      return;
    }
    try {
      const { data } = await addReelComment(reel._id, commentText);
      setComments(c => [...c, data.comment]);
      setCommentText('');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleShare = async () => {
    const shareUrl = isExternal ? reel.externalUrl : window.location.href;
    try {
      await navigator.share({ title: 'JIOREELS', text: reel.caption, url: shareUrl });
    } catch {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied!');
    }
  };

  const formatCount = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n;

  // Profile avatar for external reels (no profile pic URL from Pexels)
  const avatarEl = isExternal ? (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0,
    }}>
      {reel.userId?.username?.[0]?.toUpperCase() || 'P'}
    </div>
  ) : (
    <img
      src={reel.userId?.profilePic}
      alt={reel.userId?.username}
      className={`avatar ${styles.avatar}`}
    />
  );

  return (
    <div className={styles.reelCard}>
      {/* External badge */}
      {isExternal && (
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 20,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          borderRadius: 12, padding: '3px 10px', fontSize: 11, color: '#fff',
          display: 'flex', alignItems: 'center', gap: 5,
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          🎬 Pexels
        </div>
      )}

      {/* Video */}
      <div className={styles.videoWrapper} onClick={handleVideoClick}>
        <video
          ref={videoRef}
          src={reel.videoUrl}
          loop
          muted={isMuted}
          playsInline
          className={styles.video}
        />

        {isPaused && (
          <div className={styles.pauseOverlay}>
            <AiFillPlayCircle />
          </div>
        )}

        <div className={styles.topGradient} />
        <div className={styles.bottomGradient} />

        <button
          className={styles.muteBtn}
          onClick={e => { e.stopPropagation(); setIsMuted(m => !m); }}
        >
          {isMuted ? <BsVolumeMute /> : <BsVolumeUp />}
        </button>
      </div>

      {/* Right actions */}
      <div className={styles.actions}>
        {/* Avatar / profile link */}
        {isExternal ? (
          <a
            href={reel.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.avatarLink}
          >
            {avatarEl}
            <div className={styles.followDot}>↗</div>
          </a>
        ) : (
          <Link to={`/${reel.userId?.username}`} className={styles.avatarLink}>
            {avatarEl}
            <div className={styles.followDot}>+</div>
          </Link>
        )}

        <button className={`${styles.actionBtn} ${isLiked ? styles.liked : ''}`} onClick={handleLike}>
          {isLiked ? <AiFillHeart /> : <AiOutlineHeart />}
          <span>{isExternal ? '—' : formatCount(likesCount)}</span>
        </button>

        <button className={styles.actionBtn} onClick={() => setShowComments(v => !v)}>
          <AiOutlineComment />
          <span>{isExternal ? '—' : formatCount(comments.length)}</span>
        </button>

        <button className={styles.actionBtn} onClick={handleShare}>
          <AiOutlineShareAlt />
          <span>Share</span>
        </button>

        {!isExternal && (
          <button className={styles.actionBtn}>
            <AiOutlineMore />
          </button>
        )}
      </div>

      {/* Bottom info */}
      <div className={styles.info}>
        <div className={styles.userRow}>
          {isExternal ? (
            <a
              href={reel.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.username}
              style={{ textDecoration: 'none' }}
            >
              @{reel.userId?.username}
            </a>
          ) : (
            <Link to={`/${reel.userId?.username}`} className={styles.username}>
              @{reel.userId?.username}
              {reel.userId?.isVerified && <span className={styles.verified}>✓</span>}
            </Link>
          )}
          <span className={styles.time}>{format(reel.createdAt)}</span>
        </div>

        {reel.caption && <p className={styles.caption}>{reel.caption}</p>}

        {reel.hashtags?.length > 0 && (
          <p className={styles.hashtags}>
            {reel.hashtags.map(h => <span key={h}>#{h} </span>)}
          </p>
        )}

        <div className={styles.audioRow}>
          <BsMusicNote className={styles.musicNote} />
          <span className={styles.audioName}>{reel.audio || 'Original Audio'}</span>
          {isExternal && (
            <a
              href={reel.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}
            >
              via Pexels ↗
            </a>
          )}
        </div>
      </div>

      {/* Comments panel */}
      {showComments && (
        <div className={`${styles.commentsPanel} glass`} onClick={e => e.stopPropagation()}>
          {isExternal ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
              <p style={{ marginBottom: 12 }}>This is a Pexels video. Comment on Pexels!</p>
              <a
                href={reel.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block', padding: '8px 20px',
                  background: 'var(--brand-gradient)', borderRadius: 20,
                  color: '#fff', fontWeight: 600, textDecoration: 'none',
                }}
              >
                Open on Pexels ↗
              </a>
            </div>
          ) : (
            <>
              <div className={styles.commentsList}>
                {comments.length === 0 && <p className={styles.noComments}>No comments yet. Be the first!</p>}
                {comments.map((c, i) => (
                  <div key={i} className={styles.comment}>
                    <img src={c.userId?.profilePic} alt="" className={`avatar ${styles.commentAvatar}`} />
                    <div>
                      <span className={styles.commentUser}>{c.userId?.username}</span>
                      <span className={styles.commentText}> {c.text}</span>
                      <span className={styles.commentTime}>{format(c.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleComment} className={styles.commentForm}>
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className={styles.commentInput}
                />
                <button type="submit" className={styles.commentSubmit} disabled={!commentText.trim()}>Post</button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
