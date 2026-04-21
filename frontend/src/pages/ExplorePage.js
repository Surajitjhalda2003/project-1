import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getExploreReels } from '../utils/api';
import Loader from '../components/Layout/Loader';
import { BsFillPlayFill } from 'react-icons/bs';
import { AiFillHeart } from 'react-icons/ai';
import styles from './ExplorePage.module.css';

export default function ExplorePage() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getExploreReels(1);
        setReels(data.reels);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className={styles.loading}><Loader size="lg" /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Explore</h1>
        <p>Discover trending reels & posts</p>
      </div>

      <div className={styles.grid}>
        {reels.map((reel, i) => (
          <Link
            key={reel._id}
            to="/reels"
            className={`${styles.gridItem} ${i % 7 === 0 || i % 7 === 3 ? styles.large : ''}`}
          >
            <video src={reel.videoUrl} className={styles.gridVideo} muted preload="metadata" />
            <div className={styles.overlay}>
              <BsFillPlayFill className={styles.playIcon} />
              <div className={styles.stats}>
                <AiFillHeart />
                <span>{reel.likes?.length || 0}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
