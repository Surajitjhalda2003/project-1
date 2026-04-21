import React, { useState } from 'react';
import ReelsFeed from '../components/Reels/ReelsFeed';
import styles from './ReelsPage.module.css';

export default function ReelsPage() {
  const [mode, setMode] = useState('explore');

  return (
    <div className={styles.page}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${mode === 'feed' ? styles.active : ''}`}
          onClick={() => setMode('feed')}
        >
          Following
        </button>
        <button
          className={`${styles.tab} ${mode === 'explore' ? styles.active : ''}`}
          onClick={() => setMode('explore')}
        >
          For You
        </button>
      </div>
      <ReelsFeed key={mode} mode={mode} />
    </div>
  );
}
