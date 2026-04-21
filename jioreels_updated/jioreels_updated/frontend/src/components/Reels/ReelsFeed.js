import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReelCard from './ReelCard';
import Loader from '../Layout/Loader';
import { getReelsFeed, getExploreReels } from '../../utils/api';
import styles from './ReelsFeed.module.css';

export default function ReelsFeed({ mode = 'feed' }) {
  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const fetchReels = useCallback(async (pageNum) => {
    try {
      setLoading(true);
      const fetchFn = mode === 'feed' ? getReelsFeed : getExploreReels;
      const { data } = await fetchFn(pageNum);
      setReels(prev => pageNum === 1 ? data.reels : [...prev, ...data.reels]);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    setReels([]);
    setPage(1);
    setActiveIndex(0);
    fetchReels(1);
  }, [mode, fetchReels]);

  // Intersection observer for active reel tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll('[data-reel-index]');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setActiveIndex(parseInt(entry.target.dataset.reelIndex));
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    cards.forEach(card => io.observe(card));
    return () => io.disconnect();
  }, [reels]);

  // Sentinel observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(p => p + 1);
        }
      },
      { threshold: 0.1 }
    );
    io.observe(sentinelRef.current);
    observerRef.current = io;
    return () => io.disconnect();
  }, [hasMore, loading]);

  useEffect(() => {
    if (page > 1) fetchReels(page);
  }, [page, fetchReels]);

  if (loading && reels.length === 0) {
    return (
      <div className={styles.loadingScreen}>
        <Loader size="lg" />
        <p>Loading reels...</p>
      </div>
    );
  }

  if (!loading && reels.length === 0) {
    return (
      <div className={styles.empty}>
        <h3>No reels yet</h3>
        <p>Follow people or explore to discover reels</p>
      </div>
    );
  }

  return (
    <div className={styles.feedContainer} ref={containerRef}>
      {reels.map((reel, index) => (
        <div key={reel._id} data-reel-index={index} className={styles.reelSlide}>
          <ReelCard reel={reel} isActive={index === activeIndex} />
        </div>
      ))}

      {hasMore && (
        <div ref={sentinelRef} className={styles.sentinel}>
          {loading && <Loader size="md" />}
        </div>
      )}
    </div>
  );
}
