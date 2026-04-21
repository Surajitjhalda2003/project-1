import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, markNotificationsRead } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import Loader from '../components/Layout/Loader';
import { format } from 'timeago.js';
import styles from './NotificationsPage.module.css';

const typeIcons = {
  like_post: '❤️',
  like_reel: '❤️',
  comment_post: '💬',
  comment_reel: '💬',
  follow: '👤',
  mention: '@',
  tag: '🏷️',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getNotifications();
        setNotifications(data.notifications);
        await markNotificationsRead();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Real-time notifications
  useEffect(() => {
    if (!socket) return;
    const handleNotif = (notif) => {
      setNotifications(prev => [notif, ...prev]);
    };
    socket.on('notification', handleNotif);
    return () => socket.off('notification', handleNotif);
  }, [socket]);

  if (loading) return <div className={styles.loading}><Loader size="lg" /></div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Notifications</h1>

      {notifications.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🔔</span>
          <h3>No notifications yet</h3>
          <p>When people interact with your content, you'll see it here.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {notifications.map((n, i) => (
            <div key={n._id || i} className={`${styles.notifItem} ${!n.isRead ? styles.unread : ''}`}>
              <div className={styles.leftSection}>
                <div className={styles.avatarWrap}>
                  <img
                    src={n.sender?.profilePic}
                    alt={n.sender?.username}
                    className={`avatar ${styles.avatar}`}
                  />
                  <span className={styles.typeIcon}>{typeIcons[n.type]}</span>
                </div>
                <div className={styles.content}>
                  <p className={styles.message}>
                    <Link to={`/${n.sender?.username}`} className={styles.senderName}>
                      {n.sender?.username}
                    </Link>
                    {' '}{n.message?.replace(n.sender?.username, '').trim()}
                  </p>
                  <span className={styles.time}>{format(n.createdAt)}</span>
                </div>
              </div>

              {(n.post?.mediaUrl?.[0] || n.reel?.thumbnailUrl) && (
                <div className={styles.thumbnail}>
                  <img
                    src={n.post?.mediaUrl?.[0] || n.reel?.thumbnailUrl}
                    alt=""
                    className={styles.thumbImg}
                  />
                </div>
              )}

              {n.type === 'follow' && (
                <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                  Follow back
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
