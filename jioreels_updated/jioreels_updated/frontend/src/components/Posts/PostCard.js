import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { togglePostLike, addPostComment, deletePost } from '../../utils/api';
import { format } from 'timeago.js';
import {
  AiFillHeart, AiOutlineHeart, AiOutlineComment,
  AiOutlineShareAlt, AiOutlineMore, AiOutlineSave, AiFillSave,
  AiOutlineDelete,
} from 'react-icons/ai';
import styles from './PostCard.module.css';

export default function PostCard({ post: initialPost, onDelete }) {
  const { user } = useAuth();
  const [post, setPost]                   = useState(initialPost);
  const [isLiked, setIsLiked]             = useState(initialPost.likes?.includes(user?._id));
  const [likesCount, setLikesCount]       = useState(initialPost.likes?.length || 0);
  const [isSaved, setIsSaved]             = useState(false);
  const [commentText, setCommentText]     = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [mediaIndex, setMediaIndex]       = useState(0);
  const [showMenu, setShowMenu]           = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [deleted, setDeleted]             = useState(false);
  const menuRef                           = useRef(null);

  const isOwner = post.userId?._id === user?._id || post.userId === user?._id;

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLike = async () => {
    const prev = isLiked;
    setIsLiked(!prev);
    setLikesCount(c => prev ? c - 1 : c + 1);
    try {
      await togglePostLike(post._id);
    } catch {
      setIsLiked(prev);
      setLikesCount(c => prev ? c + 1 : c - 1);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const { data } = await addPostComment(post._id, commentText);
      setPost(p => ({ ...p, comments: [...p.comments, data.comment] }));
      setCommentText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(true);
    setShowMenu(false);
    try {
      await deletePost(post._id);
      setDeleted(true);
      onDelete?.(post._id);
    } catch (err) {
      console.error(err);
      alert('Failed to delete post. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (deleted) return null;

  const displayedComments = showAllComments ? post.comments : post.comments?.slice(-2);

  return (
    <article className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <Link to={`/${post.userId?.username}`} className={styles.userInfo}>
          <div className="avatar-ring">
            <img src={post.userId?.profilePic} alt="" className={`avatar ${styles.avatar}`} />
          </div>
          <div>
            <span className={styles.username}>
              {post.userId?.username}
              {post.userId?.isVerified && <span className={styles.verified}>✓</span>}
            </span>
            {post.location && <span className={styles.location}>{post.location}</span>}
          </div>
        </Link>

        {/* More menu */}
        <div className={styles.menuWrap} ref={menuRef}>
          <button className={styles.moreBtn} onClick={() => setShowMenu(v => !v)}>
            <AiOutlineMore />
          </button>
          {showMenu && (
            <div className={styles.dropdown}>
              {isOwner && (
                <button
                  className={`${styles.dropdownItem} ${styles.deleteItem}`}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <AiOutlineDelete />
                  {deleting ? 'Deleting...' : 'Delete post'}
                </button>
              )}
              <button className={styles.dropdownItem} onClick={() => setShowMenu(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      <div className={styles.mediaWrapper}>
        {post.mediaUrl?.length > 1 && (
          <div className={styles.carouselDots}>
            {post.mediaUrl.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === mediaIndex ? styles.activeDot : ''}`}
                onClick={() => setMediaIndex(i)}
              />
            ))}
          </div>
        )}
        <img
          src={post.mediaUrl?.[mediaIndex]}
          alt={post.altText || post.caption}
          className={styles.media}
          onDoubleClick={handleLike}
        />
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <div className={styles.leftActions}>
          <button className={`${styles.actionBtn} ${isLiked ? styles.liked : ''}`} onClick={handleLike}>
            {isLiked ? <AiFillHeart /> : <AiOutlineHeart />}
          </button>
          <button className={styles.actionBtn}><AiOutlineComment /></button>
          <button className={styles.actionBtn}><AiOutlineShareAlt /></button>
        </div>
        <button className={`${styles.actionBtn} ${isSaved ? styles.saved : ''}`} onClick={() => setIsSaved(v => !v)}>
          {isSaved ? <AiFillSave /> : <AiOutlineSave />}
        </button>
      </div>

      {likesCount > 0 && (
        <div className={styles.likesCount}>
          {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
        </div>
      )}

      {post.caption && (
        <div className={styles.caption}>
          <Link to={`/${post.userId?.username}`} className={styles.captionUser}>{post.userId?.username}</Link>
          {' '}{post.caption}
          {post.hashtags?.length > 0 && (
            <span className={styles.hashtags}> {post.hashtags.map(h => `#${h}`).join(' ')}</span>
          )}
        </div>
      )}

      {post.comments?.length > 2 && !showAllComments && (
        <button className={styles.viewComments} onClick={() => setShowAllComments(true)}>
          View all {post.comments.length} comments
        </button>
      )}
      <div className={styles.comments}>
        {displayedComments?.map((c, i) => (
          <div key={i} className={styles.comment}>
            <span className={styles.commentUser}>{c.userId?.username}</span>
            <span className={styles.commentText}> {c.text}</span>
          </div>
        ))}
      </div>

      <span className={styles.time}>{format(post.createdAt)}</span>

      <form onSubmit={handleComment} className={styles.addComment}>
        <input
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          className={styles.commentInput}
        />
        {commentText.trim() && (
          <button type="submit" className={styles.postBtn}>Post</button>
        )}
      </form>
    </article>
  );
}
